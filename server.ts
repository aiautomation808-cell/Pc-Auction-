import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const BIDS_FILE = path.join(process.cwd(), 'bids.json');

app.use(express.json());

// Initialize bids file
if (!fs.existsSync(BIDS_FILE)) {
  fs.writeFileSync(BIDS_FILE, JSON.stringify([]));
}

function getBids() {
  try {
    const data = fs.readFileSync(BIDS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function saveBids(bids: any) {
  fs.writeFileSync(BIDS_FILE, JSON.stringify(bids, null, 2));
}

// API Routes
app.get('/api/bids', (req, res) => {
  res.json(getBids());
});

app.post('/api/bids', (req, res) => {
  const bids = getBids();
  const bidAmt = req.body.amount;
  
  // Basic validation on server as well
  const currentHighest = bids.length > 0 ? Math.max(...bids.map((b: any) => b.amount)) : 0;
  if (bidAmt < currentHighest + 500) {
    return res.status(400).json({ error: `Minimum bid is ₹${currentHighest + 500}` });
  }

  const newBid = { 
    id: Date.now().toString() + Math.random().toString().substring(2, 6), 
    name: req.body.name,
    age: req.body.age,
    whatsapp: req.body.whatsapp,
    amount: bidAmt,
    timestamp: new Date().toISOString() 
  };
  bids.push(newBid);
  saveBids(bids);
  res.json(newBid);
});

app.delete('/api/bids', (req, res) => {
  saveBids([]);
  res.json({ success: true });
});

app.delete('/api/bids/:id', (req, res) => {
  let bids = getBids();
  bids = bids.filter((b: any) => b.id !== req.params.id);
  saveBids(bids);
  res.json({ success: true });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
