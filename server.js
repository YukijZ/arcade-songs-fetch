const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection
const sequelize = new Sequelize({
  dialect: 'mssql',
  host: 'MINGU',
  port: 1433,
  username: 'sa',
  password: '12345',
  database: 'maimai',
  dialectOptions: {
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  },
});

// Define models based on your database schema
const Song = sequelize.define('Song', {
  songId: { type: DataTypes.STRING, primaryKey: true },
  category: DataTypes.STRING,
  title: DataTypes.STRING,
  artist: DataTypes.STRING,
  imageName: DataTypes.STRING,
  imageUrl: DataTypes.STRING,
  version: DataTypes.STRING,
  releaseDate: DataTypes.DATE,
  isNew: DataTypes.BOOLEAN,
  isLocked: DataTypes.BOOLEAN,
}, {
  tableName: 'Songs',
  timestamps: false,
});

const Sheet = sequelize.define('Sheet', {
  songId: { type: DataTypes.STRING, primaryKey: true },
  type: DataTypes.STRING,
  difficulty: DataTypes.STRING,
  level: DataTypes.STRING,
}, {
  tableName: 'Sheets',
  timestamps: false,
});

// Set up associations
Song.hasMany(Sheet, { foreignKey: 'songId', as: 'charts' });
Sheet.belongsTo(Song, { foreignKey: 'songId' });

// API Routes

// Get random songs (12 songs that change on each request)
app.get('/api/songs', async (req, res) => {
  try {
    // Get total count first
    const totalCount = await Song.count();
    
    // Generate 12 random offsets
    const randomOffsets = [];
    for (let i = 0; i < 12; i++) {
      randomOffsets.push(Math.floor(Math.random() * totalCount));
    }
    
    // Get songs at random positions
    const songs = [];
    for (const offset of randomOffsets) {
      const song = await Song.findOne({
        offset: offset,
        limit: 1
      });
      if (song) {
        songs.push(song);
      }
    }
    
    // Then get charts separately and attach them
    for (let song of songs) {
      const charts = await Sheet.findAll({
        where: { songId: song.songId }
      });
      song.dataValues.charts = charts;
    }
    
    res.json(songs);
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
});

// Get random songs
app.get('/api/random-songs', async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 4;
    
    // Get total count first
    const totalCount = await Song.count();
    
    // Generate random offsets
    const randomOffsets = [];
    for (let i = 0; i < count; i++) {
      randomOffsets.push(Math.floor(Math.random() * totalCount));
    }
    
    // Get songs at random positions
    const songs = [];
    for (const offset of randomOffsets) {
      const song = await Song.findOne({
        offset: offset,
        limit: 1
      });
      if (song) {
        songs.push(song);
      }
    }
    
    // Get charts for each song
    for (let song of songs) {
      const charts = await Sheet.findAll({
        where: { songId: song.songId }
      });
      song.dataValues.charts = charts;
    }
    
    res.json(songs);
  } catch (error) {
    console.error('Error fetching random songs:', error);
    res.status(500).json({ error: 'Failed to fetch random songs' });
  }
});

// Get song by ID
app.get('/api/songs/:songId', async (req, res) => {
  try {
    const song = await Song.findOne({
      where: { songId: req.params.songId },
    });
    
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }
    
    // Get charts for the song
    const charts = await Sheet.findAll({
      where: { songId: song.songId }
    });
    song.dataValues.charts = charts;
    
    res.json(song);
  } catch (error) {
    console.error('Error fetching song:', error);
    res.status(500).json({ error: 'Failed to fetch song' });
  }
});

// Search songs
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const songs = await Song.findAll({
      where: {
        [Sequelize.Op.or]: [
          { title: { [Sequelize.Op.like]: `%${query}%` } },
          { artist: { [Sequelize.Op.like]: `%${query}%` } },
        ],
      },
      order: [['title', 'ASC']],
      limit: 20 // Limit search results for better performance
    });
    
    // Get charts for each song
    for (let song of songs) {
      const charts = await Sheet.findAll({
        where: { songId: song.songId }
      });
      song.dataValues.charts = charts;
    }
    
    res.json(songs);
  } catch (error) {
    console.error('Error searching songs:', error);
    res.status(500).json({ error: 'Failed to search songs' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Test database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await testConnection();
});
