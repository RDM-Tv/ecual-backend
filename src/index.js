// ─── SERVIDOR API ECUANEWS ────────────────────────────────────────────────────
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const { fetchAll } = require('./fetcher');

const app = express();
const PORT = process.env.PORT || 3000;
const INTERVAL = 15; // cada 15 minutos, fijo

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.use(cors());
app.use(express.json());

// GET /api/noticias
app.get('/api/noticias', async (req, res) => {
  try {
    const { ciudad, categoria, q, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('noticias')
      .select('*', { count: 'exact' })
      .order('publicado_en', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (ciudad && ciudad !== 'todas' && !q) {
      query = query.or(`ciudad.eq.${ciudad},ciudad.eq.nacional`);
    }
    if (categoria && categoria !== 'todas') {
      query = query.eq('categoria', categoria);
    }
    if (q) {
      const qc = q.trim();
      query = query.or(
        `titulo.ilike.%${qc}%,` +
        `resumen.ilike.%${qc}%,` +
        `fuente_nombre.ilike.%${qc}%,` +
        `ciudad_label.ilike.%${qc}%,` +
        `fuente_id.ilike.%${qc}%`
      );
    }

    const { data, error, count } = await query;
    if (error) return res.status(500).json({ error: error.message });

    res.json({ ok: true, total: count, noticias: data || [], actualizado: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/noticias/:id
app.get('/api/noticias/:id', async (req, res) => {
  const { data, error } = await supabase.from('noticias').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ ok: false, error: 'No encontrada' });
  res.json({ ok: true, noticia: data });
});

// GET /api/ciudades
app.get('/api/ciudades', async (req, res) => {
  const { data, error } = await supabase
    .from('noticias').select('ciudad, ciudad_label')
    .gte('publicado_en', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  if (error) return res.status(500).json({ ok: false, error: error.message });
  const counts = {};
  for (const row of data || []) {
    if (!counts[row.ciudad]) counts[row.ciudad] = { ciudad: row.ciudad, label: row.ciudad_label, total: 0 };
    counts[row.ciudad].total++;
  }
  res.json({ ok: true, ciudades: Object.values(counts).sort((a,b) => b.total - a.total) });
});

// GET /api/fuentes
app.get('/api/fuentes', async (req, res) => {
  const { data, error } = await supabase.from('noticias').select('fuente_id, fuente_nombre, publicado_en').order('publicado_en', { ascending: false });
  if (error) return res.status(500).json({ ok: false, error: error.message });
  const fuentes = {};
  for (const row of data || []) {
    if (!fuentes[row.fuente_id]) fuentes[row.fuente_id] = { id: row.fuente_id, nombre: row.fuente_nombre, ultima_noticia: row.publicado_en, total: 0 };
    fuentes[row.fuente_id].total++;
  }
  res.json({ ok: true, fuentes: Object.values(fuentes) });
});

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({ ok: true, version: '1.0.0', uptime: Math.floor(process.uptime()) });
});

// POST /api/fetch
app.post('/api/fetch', (req, res) => {
  fetchAll().catch(console.error);
  res.json({ ok: true, message: 'Fetch iniciado' });
});

// CRON cada 15 minutos
cron.schedule(`*/${INTERVAL} * * * *`, () => {
  console.log(`\n⏰ Cron — ${new Date().toLocaleString('es-EC')}`);
  fetchAll().catch(console.error);
});

app.listen(PORT, () => {
  console.log(`\n🚀 EcuaNews API en puerto ${PORT}`);
  console.log(`⏰ Fetch cada ${INTERVAL} minutos`);
  fetchAll().catch(console.error);
});

module.exports = app;
