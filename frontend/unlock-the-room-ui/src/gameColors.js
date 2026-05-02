// Canonical game-object color palette — used by GameCanvas, LevelEditor, and AiGenerator.
// These are gameplay-semantic colors tied to barrier/key matching rules, NOT design tokens.

export const BARRIER_COLORS = {
  Red:    '#E24B4A',
  Blue:   '#378ADD',
  Green:  '#639922',
  Yellow: '#EF9F27',
  Purple: '#7F77DD',
  White:  '#E8E8E8',
};

// Brightened shades of each barrier color for cap lines and glow highlights
export const BARRIER_BRIGHT_COLORS = {
  Red:    '#FF8F8E',
  Blue:   '#75BDFF',
  Green:  '#9AE037',
  Yellow: '#FFD466',
  Purple: '#B0A8FF',
  White:  '#FFFFFF',
};

// Object-type colors for the level editor and AI generator preview grid
export const OBJECT_COLORS = {
  Platform:  '#4a4a6a',
  ExitDoor:  '#1D9E75',
  Hazard:    '#888888',
  KillBrick: '#C0392B',
  SpawnPoint:'#378ADD',
  Key:       '#EF9F27',
  Barrier:   '#7F77DD',
  Button:    '#888780',
};

// Canvas rendering palette for platform tiles
export const PLATFORM_COLORS = {
  body:          '#3d3d5c',
  topHighlight:  '#6060a0',
  inner:         '#48486e',
  bottomShadow:  '#2a2a42',
};

// Level editor boundary-wall tiles
export const WALL_COLORS = {
  bg:     '#2e2e48',
  border: '#3a3a58',
};

// Kill brick rendering
export const KILLBRICK_BG = '#2a0000';

// Exit door states
export const EXIT_COLORS = {
  activeBg:       '#0d6b4f',
  inactiveBg:     '#252538',
  activeBorder:   '#1DB988',
  inactiveBorder: '#555555',
  activeInner:    '#80F5D2',
  inactiveInner:  '#444444',
  activeLabel:    '#80F5D2',
  inactiveLabel:  '#666666',
};

// Spike hazard
export const SPIKE_COLORS = {
  body: '#888888',
  edge: '#aaaaaa',
};

// Player fallback rect (shown before sprite sheet loads)
export const PLAYER_FALLBACK = '#9898ac';

// High-contrast mode overrides (hazards use yellow border, collectibles use white)
export const HIGH_CONTRAST_BORDER = '#ff0';
export const HIGH_CONTRAST_WHITE = '#ffffff';

// Fallback game background (same value as --game-bg CSS var)
export const GAME_BG_FALLBACK = '#1a1a2e';

// Game UI shell colors — used in React inline styles for game screens.
// CSS custom properties can't be read synchronously in JS style objects,
// so these parallel the CSS token values for dark-mode game chrome.
export const GAME_UI = {
  // ── Surfaces ────────────────────────────────────────────────
  cardBg:             '#2a2a3e',   // modal / card bg (GameLogin, SavedLevels, Settings)
  cardBgDeep:         '#1e1e32',   // LevelSelect outer card
  rowBg:              '#16162a',   // LevelSelect notice + level card bg
  rowHoverBg:         '#1e1e38',   // level card hover bg
  menuBtnBg:          '#222238',   // MainMenu default button
  menuBtnHoverBg:     '#2c2c4a',

  // ── Borders ─────────────────────────────────────────────────
  cardBorder:         '#444444',   // generic card / input border
  cardBorderDeep:     '#333350',   // LevelSelect card border
  rowBorder:          '#2e2e4a',   // level card border
  menuBtnBorder:      '#363654',
  menuBtnHoverBorder: '#4a4a6a',
  subtleBorder:       '#333333',   // Settings dividers + back-button borders

  // ── Text ────────────────────────────────────────────────────
  textNormal:         '#d0d0d0',   // MainMenu button label
  textMuted:          '#888888',   // subtitles / metadata / disabled
  textDim:            '#666666',   // back buttons / secondary labels
  textSubtle:         '#5a5a7a',   // MainMenu subtitle + tooltip
  textNotice:         '#6a6a8a',   // LevelSelect notice text
  textLocked:         '#444466',   // MainMenu "Logged in as"
  textPlaceholder:    '#aaaaaa',   // input labels, level name overflow text

  // ── Accents ─────────────────────────────────────────────────
  accentPurple:       '#7F77DD',   // level numbers, link text, badge colour
  primaryHoverBg:     '#6258cc',   // primary button hover background
  primaryHoverBorder: '#9590e8',   // primary button hover border
  devDashBlue:        '#185FA5',   // developer-dashboard shortcut button

  // ── Difficulty labels ────────────────────────────────────────
  diffEasy:           '#639922',
  diffMedium:         '#BA7517',
  // diffHard → use var(--color-danger-text) (#A32D2D)
};
