
import { Region } from "../types";

export interface SeedEntry {
  category: string;
  word: string;
  clue: string;
  difficulty: number; // 1: Easy, 2: Medium, 3: Hard
  regions: Region[];
}

export const SEED_DATA: SeedEntry[] = [
  // --- TV BINGERS ---
  { category: 'TV Bingers', word: 'FRIENDS', clue: 'Pivot! Pivot! Pivot!', difficulty: 1, regions: ['Mix', 'USA', 'UK'] },
  { category: 'TV Bingers', word: 'OFFICE', clue: 'Dunder Mifflin sitcom', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'TV Bingers', word: 'LOST', clue: 'Plane crash on mysterious island', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'TV Bingers', word: 'SOPRANOS', clue: 'New Jersey mob boss', difficulty: 2, regions: ['Mix', 'USA'] },
  { category: 'TV Bingers', word: 'THRONES', clue: 'Winter is coming', difficulty: 1, regions: ['Mix', 'USA', 'UK'] },
  { category: 'TV Bingers', word: 'BREAKING', clue: 'Chemistry teacher turns dealer', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'TV Bingers', word: 'STRANGER', clue: 'Hawkins upside down', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'TV Bingers', word: 'CROWN', clue: 'Royal family drama', difficulty: 2, regions: ['Mix', 'UK'] },
  { category: 'TV Bingers', word: 'MANDALORIAN', clue: 'Baby Yoda guardian', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'TV Bingers', word: 'TED', clue: 'Lasso the soccer coach', difficulty: 1, regions: ['Mix', 'USA', 'UK'] },
  { category: 'TV Bingers', word: 'BEAR', clue: 'Chef Carmy kitchen chaos', difficulty: 2, regions: ['Mix', 'USA'] },
  { category: 'TV Bingers', word: 'SUCCESSION', clue: 'Roy family power struggle', difficulty: 2, regions: ['Mix', 'USA'] },
  { category: 'TV Bingers', word: 'WEDNESDAY', clue: 'Addams family daughter', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'TV Bingers', word: 'SQUID', clue: 'Deadly Korean children games', difficulty: 1, regions: ['Mix'] },
  { category: 'TV Bingers', word: 'WIRE', clue: 'Baltimore drug trade drama', difficulty: 3, regions: ['Mix', 'USA'] },
  { category: 'TV Bingers', word: 'FLEABAG', clue: 'Phoebe Waller-Bridge dramedy', difficulty: 2, regions: ['Mix', 'UK'] },
  { category: 'TV Bingers', word: 'SHERLOCK', clue: 'Cumberbatch detective', difficulty: 1, regions: ['Mix', 'UK'] },
  { category: 'TV Bingers', word: 'DOCTOR', clue: 'Time lord in a TARDIS', difficulty: 1, regions: ['Mix', 'UK'] },
  { category: 'TV Bingers', word: 'OFFICE', clue: 'Wernham Hogg paper merchants', difficulty: 2, regions: ['UK'] },
  { category: 'TV Bingers', word: 'SIMPSONS', clue: 'Yellow family from Springfield', difficulty: 1, regions: ['Mix', 'USA'] },

  // --- BLOCKBUSTERS ---
  { category: 'Blockbusters', word: 'TITANIC', clue: 'Near, far, wherever you are', difficulty: 1, regions: ['Mix', 'USA', 'UK'] },
  { category: 'Blockbusters', word: 'AVATAR', clue: 'Blue aliens on Pandora', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Blockbusters', word: 'MATRIX', clue: 'Red pill or blue pill?', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Blockbusters', word: 'GLADIATOR', clue: 'Are you not entertained?', difficulty: 1, regions: ['Mix', 'USA', 'UK'] },
  { category: 'Blockbusters', word: 'INCEPTION', clue: 'Dream within a dream', difficulty: 2, regions: ['Mix', 'USA'] },
  { category: 'Blockbusters', word: 'JURASSIC', clue: 'Dinosaur park gone wrong', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Blockbusters', word: 'BARBIE', clue: 'She has everything, he is just Ken', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Blockbusters', word: 'OPPENHEIMER', clue: 'Destroyer of worlds biopic', difficulty: 2, regions: ['Mix', 'USA'] },
  { category: 'Blockbusters', word: 'DUNE', clue: 'Spice must flow', difficulty: 2, regions: ['Mix', 'USA'] },
  { category: 'Blockbusters', word: 'AVENGERS', clue: 'Marvel superhero team', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Blockbusters', word: 'FROZEN', clue: 'Let it go, let it go', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Blockbusters', word: 'SHREK', clue: 'Ogre with layers', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Blockbusters', word: 'SKYFALL', clue: 'Bond 007 adventure', difficulty: 1, regions: ['Mix', 'UK'] },
  { category: 'Blockbusters', word: 'JOKER', clue: 'Batman villain origin', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Blockbusters', word: 'PANTHER', clue: 'Wakanda forever', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Blockbusters', word: 'POTTER', clue: 'Boy wizard', difficulty: 1, regions: ['Mix', 'UK'] },
  { category: 'Blockbusters', word: 'WONKA', clue: 'Chocolate factory owner', difficulty: 1, regions: ['Mix', 'UK', 'USA'] },
  { category: 'Blockbusters', word: 'BOND', clue: '007', difficulty: 1, regions: ['Mix', 'UK'] },

  // --- HIT MAKERS ---
  { category: 'Hit Makers', word: 'BEYONCE', clue: 'Queen Bey', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Hit Makers', word: 'ADELE', clue: 'Singer who says Hello', difficulty: 1, regions: ['Mix', 'UK'] },
  { category: 'Hit Makers', word: 'SWIFT', clue: 'Eras Tour superstar', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Hit Makers', word: 'DRAKE', clue: 'Canadian rapper', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Hit Makers', word: 'EMINEM', clue: 'The real Slim Shady', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Hit Makers', word: 'BEATLES', clue: 'Fab Four from Liverpool', difficulty: 1, regions: ['Mix', 'UK'] },
  { category: 'Hit Makers', word: 'NIRVANA', clue: 'Smells Like Teen Spirit', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Hit Makers', word: 'QUEEN', clue: 'Bohemian Rhapsody band', difficulty: 1, regions: ['Mix', 'UK'] },
  { category: 'Hit Makers', word: 'GAGA', clue: 'Little Monsters mother', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Hit Makers', word: 'ELVIS', clue: 'King of Rock and Roll', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Hit Makers', word: 'RIHANNA', clue: 'Umbrella singer', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Hit Makers', word: 'WEEKND', clue: 'Blinding Lights singer', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Hit Makers', word: 'STYLES', clue: 'One Direction to Solo Star', difficulty: 1, regions: ['Mix', 'UK'] },
  { category: 'Hit Makers', word: 'SHEERAN', clue: 'Shape of You singer', difficulty: 1, regions: ['Mix', 'UK'] },
  { category: 'Hit Makers', word: 'OASIS', clue: 'Wonderwall band', difficulty: 2, regions: ['Mix', 'UK'] },

  // --- 90s NOSTALGIA ---
  { category: '90s Nostalgia', word: 'TAMAGOTCHI', clue: 'Digital pocket pet', difficulty: 2, regions: ['Mix'] },
  { category: '90s Nostalgia', word: 'FURBY', clue: 'Talking robotic toy', difficulty: 1, regions: ['Mix'] },
  { category: '90s Nostalgia', word: 'SPICE', clue: 'Girls causing Girl Power', difficulty: 1, regions: ['Mix', 'UK'] },
  { category: '90s Nostalgia', word: 'FRIENDS', clue: 'Ross, Rachel, Monica', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: '90s Nostalgia', word: 'MATRIX', clue: '1999 sci-fi hit', difficulty: 1, regions: ['Mix'] },
  { category: '90s Nostalgia', word: 'POKEMON', clue: 'Gotta catch em all', difficulty: 1, regions: ['Mix'] },
  { category: '90s Nostalgia', word: 'DIALUP', clue: 'Noisy internet connection', difficulty: 2, regions: ['Mix'] },
  { category: '90s Nostalgia', word: 'WALKMAN', clue: 'Portable cassette player', difficulty: 1, regions: ['Mix'] },
  { category: '90s Nostalgia', word: 'POGS', clue: 'Cardboard disk game', difficulty: 3, regions: ['Mix'] },
  { category: '90s Nostalgia', word: 'BEANIE', clue: 'Ty Babies collectible', difficulty: 2, regions: ['Mix'] },
  { category: '90s Nostalgia', word: 'BLOCKBUSTER', clue: 'Video rental store', difficulty: 1, regions: ['Mix'] },
  { category: '90s Nostalgia', word: 'GRUNGE', clue: 'Seattle music sound', difficulty: 2, regions: ['Mix', 'USA'] },
  { category: '90s Nostalgia', word: 'SEINFELD', clue: 'Show about nothing', difficulty: 1, regions: ['Mix', 'USA'] },

  // --- GAMING LEGENDS ---
  { category: 'Gaming Legends', word: 'MARIO', clue: 'Plumber in red cap', difficulty: 1, regions: ['Mix'] },
  { category: 'Gaming Legends', word: 'ZELDA', clue: 'Princess of Hyrule', difficulty: 1, regions: ['Mix'] },
  { category: 'Gaming Legends', word: 'SONIC', clue: 'Fast blue hedgehog', difficulty: 1, regions: ['Mix'] },
  { category: 'Gaming Legends', word: 'MINECRAFT', clue: 'Block building phenomenon', difficulty: 1, regions: ['Mix'] },
  { category: 'Gaming Legends', word: 'FORTNITE', clue: 'Battle royale with building', difficulty: 1, regions: ['Mix'] },
  { category: 'Gaming Legends', word: 'TETRIS', clue: 'Falling blocks puzzle', difficulty: 1, regions: ['Mix'] },
  { category: 'Gaming Legends', word: 'HALO', clue: 'Master Chief shooter', difficulty: 2, regions: ['Mix'] },
  { category: 'Gaming Legends', word: 'DOOM', clue: 'Demon slaying FPS', difficulty: 2, regions: ['Mix'] },
  { category: 'Gaming Legends', word: 'SKYRIM', clue: 'Dragonborn RPG', difficulty: 2, regions: ['Mix'] },
  { category: 'Gaming Legends', word: 'PORTAL', clue: 'Cake is a lie', difficulty: 2, regions: ['Mix'] },
  { category: 'Gaming Legends', word: 'PACMAN', clue: 'Waka waka waka', difficulty: 1, regions: ['Mix'] },
  { category: 'Gaming Legends', word: 'ROBLOX', clue: 'User generated game platform', difficulty: 1, regions: ['Mix'] },

  // --- ANIME WORLD ---
  { category: 'Anime World', word: 'NARUTO', clue: 'Ninja aiming to be Hokage', difficulty: 1, regions: ['Mix'] },
  { category: 'Anime World', word: 'GOKU', clue: 'Saiyan seeking dragon balls', difficulty: 1, regions: ['Mix'] },
  { category: 'Anime World', word: 'LUFFY', clue: 'Rubber pirate captain', difficulty: 1, regions: ['Mix'] },
  { category: 'Anime World', word: 'PIKACHU', clue: 'Electric yellow mouse', difficulty: 1, regions: ['Mix'] },
  { category: 'Anime World', word: 'TOTORO', clue: 'Studio Ghibli forest spirit', difficulty: 1, regions: ['Mix'] },
  { category: 'Anime World', word: 'AKIRA', clue: 'Cyberpunk motorcycle movie', difficulty: 2, regions: ['Mix'] },
  { category: 'Anime World', word: 'TITAN', clue: 'Colossal wall breaker', difficulty: 1, regions: ['Mix'] },
  { category: 'Anime World', word: 'SAILOR', clue: 'Moon prism power', difficulty: 1, regions: ['Mix'] },
  { category: 'Anime World', word: 'NOTE', clue: 'Book that kills', difficulty: 1, regions: ['Mix'] },
  { category: 'Anime World', word: 'GHIBLI', clue: 'Famous animation studio', difficulty: 2, regions: ['Mix'] },

  // --- SPORTS ICONS ---
  { category: 'Sports Icons', word: 'JORDAN', clue: 'MJ of the Bulls', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Sports Icons', word: 'MESSI', clue: 'Argentine soccer GOAT', difficulty: 1, regions: ['Mix'] },
  { category: 'Sports Icons', word: 'SERENA', clue: 'Tennis queen Williams', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Sports Icons', word: 'TIGER', clue: 'Golf legend Woods', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Sports Icons', word: 'BRADY', clue: 'QB with 7 rings', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Sports Icons', word: 'LEBRON', clue: 'King James of NBA', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Sports Icons', word: 'BOLT', clue: 'Fastest man alive', difficulty: 1, regions: ['Mix'] },
  { category: 'Sports Icons', word: 'ALI', clue: 'Float like a butterfly', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Sports Icons', word: 'RUTH', clue: 'Babe of baseball', difficulty: 2, regions: ['Mix', 'USA'] },
  { category: 'Sports Icons', word: 'KOBE', clue: 'Black Mamba', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Sports Icons', word: 'BECKHAM', clue: 'Bend it like him', difficulty: 1, regions: ['Mix', 'UK'] },
  { category: 'Sports Icons', word: 'HAMILTON', clue: 'F1 Racing Knight', difficulty: 2, regions: ['Mix', 'UK'] },

  // --- TECH & TRENDS ---
  { category: 'Tech & Trends', word: 'APPLE', clue: 'iPhone maker', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Tech & Trends', word: 'TIKTOK', clue: 'Short video app', difficulty: 1, regions: ['Mix'] },
  { category: 'Tech & Trends', word: 'TESLA', clue: 'Electric car giant', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Tech & Trends', word: 'AMAZON', clue: 'Prime delivery', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Tech & Trends', word: 'GOOGLE', clue: 'Search engine giant', difficulty: 1, regions: ['Mix', 'USA'] },
  { category: 'Tech & Trends', word: 'VIRAL', clue: 'Spreads fast online', difficulty: 1, regions: ['Mix'] },
  { category: 'Tech & Trends', word: 'MEME', clue: 'Funny internet picture', difficulty: 1, regions: ['Mix'] },
  { category: 'Tech & Trends', word: 'WIFI', clue: 'Wireless internet', difficulty: 1, regions: ['Mix'] },
  { category: 'Tech & Trends', word: 'CRYPTO', clue: 'Digital currency', difficulty: 2, regions: ['Mix'] },
  { category: 'Tech & Trends', word: 'AI', clue: 'Artificial Intelligence', difficulty: 1, regions: ['Mix'] },
  { category: 'Tech & Trends', word: 'SELFIE', clue: 'Photo of yourself', difficulty: 1, regions: ['Mix'] },
  { category: 'Tech & Trends', word: 'STREAM', clue: 'Watch video online', difficulty: 1, regions: ['Mix'] }
];
