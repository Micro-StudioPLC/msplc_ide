import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const USERS_FILE_PATH = path.resolve(__dirname, 'data/users.json');

app.use(express.json());

// Helper to safely read users from JSON file
function readUsersFromFile(): any[] {
  try {
    if (!fs.existsSync(USERS_FILE_PATH)) {
      const dir = path.dirname(USERS_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(USERS_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(USERS_FILE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading users.json:', err);
    return [];
  }
}

// Helper to safely write users to JSON file
function writeUsersToFile(users: any[]): boolean {
  try {
    const dir = path.dirname(USERS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing users.json:', err);
    return false;
  }
}

// API: Register / Add User
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const users = readUsersFromFile();

  // Check if email already registered
  const existing = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email address already exists.' });
  }

  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: password,
    role: role || 'Automation Engineer',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  const success = writeUsersToFile(users);

  if (!success) {
    return res.status(500).json({ error: 'Failed to write to local users.json file.' });
  }

  // Return user (exclude raw password in client auth response)
  const { password: _, ...safeUser } = newUser;
  return res.status(201).json({
    message: 'User registered and saved to data/users.json successfully.',
    user: safeUser,
    filePath: 'data/users.json',
    totalUsers: users.length
  });
});

// API: Login User
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const users = readUsersFromFile();
  const user = users.find(
    (u: any) => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const { password: _, ...safeUser } = user;
  return res.json({
    message: 'Login successful.',
    user: safeUser
  });
});

// API: List all users in JSON file
app.get('/api/auth/users', (req, res) => {
  const users = readUsersFromFile();
  const safeUsers = users.map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt
  }));
  return res.json({
    users: safeUsers,
    total: safeUsers.length,
    filePath: 'data/users.json'
  });
});

// API: Raw users.json content for inspector
app.get('/api/auth/users/raw', (req, res) => {
  const users = readUsersFromFile();
  return res.json(users);
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
