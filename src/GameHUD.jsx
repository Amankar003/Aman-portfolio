import React, { useState, useEffect } from 'react';
import { ZONE_CONFIG, ZONES } from './zones.js';
import { AnimatePresence, motion } from 'framer-motion';

export function GameHUD({ gameState, onZoneSelect }) {
  const [selectedZone, setSelectedZone] = useState(null);
  const [showObjectives, setShowObjectives] = useState(true);
  const [showAchievements, setShowAchievements] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const zoneData = selectedZone ? ZONE_CONFIG[selectedZone] : null;
  const explorationProgress = gameState?.explorationPercent || 0;
  const zonesVisited = gameState?.zonesVisited || [];
  const achievements = gameState?.achievements || [];

  // Show achievement notifications
  useEffect(() => {
    if (achievements.length > 0) {
      const latest = achievements[achievements.length - 1];
      setNotifications(prev => [...prev, latest]);
      setTimeout(() => {
        setNotifications(prev => prev.slice(1));
      }, 4000);
    }
  }, [achievements]);

  return (
    <div className="game-hud">
      {/* Notifications */}
      <div className="notifications-container">
        <AnimatePresence>
          {notifications.map((notif, idx) => (
            <motion.div
              key={idx}
              className="achievement-notification"
              initial={{ opacity: 0, y: -20, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <span className="notif-icon">{notif.icon || '🏆'}</span>
              <div className="notif-content">
                <strong>{notif.title}</strong>
                <span>{notif.description}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {/* Minimap - Top Right */}
      <div className="hud-minimap">
        <div className="minimap-background">
          <svg width="200" height="200" viewBox="0 0 200 200">
            {/* Zone circles */}
            {Object.values(ZONE_CONFIG).map((zone) => (
              <g key={zone.id}>
                <circle
                  cx={100 + (zone.position.x / 100) * 50}
                  cy={100 + (zone.position.z / 100) * 50}
                  r="15"
                  fill={zone.color}
                  opacity={zonesVisited.includes(zone.id) ? 1 : 0.3}
                  stroke={zonesVisited.includes(zone.id) ? '#fff' : '#666'}
                  strokeWidth="2"
                  className={`minimap-zone ${zonesVisited.includes(zone.id) ? 'visited' : ''}`}
                  onClick={() => {
                    setSelectedZone(zone.id);
                    onZoneSelect?.(zone.id);
                  }}
                />
                <text
                  x={100 + (zone.position.x / 100) * 50}
                  y={100 + (zone.position.z / 100) * 50}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="8"
                  fill={zonesVisited.includes(zone.id) ? '#000' : '#888'}
                  pointerEvents="none"
                >
                  {zone.id.charAt(0).toUpperCase()}
                </text>
              </g>
            ))}
            {/* Player position */}
            <circle
              cx={100}
              cy={100}
              r="4"
              fill="#fff"
              stroke="#0ff"
              strokeWidth="1"
            />
          </svg>
        </div>
        <div className="minimap-label">Exploration: {explorationProgress}%</div>
      </div>

      {/* Objectives - Top Left */}
      {showObjectives && (
        <div className="hud-objectives">
          <div className="objectives-header">
            <h3>Objectives</h3>
            <button
              className="close-btn"
              onClick={() => setShowObjectives(false)}
            >
              ✕
            </button>
          </div>
          <div className="objectives-content">
            {zonesVisited.length === 0 ? (
              <div className="objective-item">
                <span className="objective-icon">🎯</span>
                <span>Explore the world and discover zones</span>
              </div>
            ) : (
              <>
                <div className="objective-item">
                  <span className="objective-icon">✓</span>
                  <span>Zones discovered: {zonesVisited.length}/5</span>
                </div>
                <div className="objective-item">
                  <span className="objective-icon">🎨</span>
                  <span>Interact with zone elements</span>
                </div>
                <div className="objective-item">
                  <span className="objective-icon">📊</span>
                  <span>Complete zone challenges</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Zone Info - Bottom Left */}
      {zoneData && (
        <div className="hud-zone-info">
          <div className="zone-info-header">
            <div
              className="zone-color-indicator"
              style={{ backgroundColor: zoneData.color }}
            />
            <div className="zone-title">
              <h3>{zoneData.name}</h3>
              <p className="zone-subtitle">{zoneData.subtitle}</p>
            </div>
          </div>
          <div className="zone-description">{zoneData.description}</div>
          <div className="zone-status">
            <span className={`status-badge ${zonesVisited.includes(zoneData.id) ? 'visited' : 'unvisited'}`}>
              {zonesVisited.includes(zoneData.id) ? '✓ Visited' : 'Not Visited'}
            </span>
          </div>
        </div>
      )}

      {/* Interaction Hint - Center Bottom */}
      <div className="hud-hints">
        {gameState?.nearbyObjects?.length > 0 && (
          <div className="interaction-hint">
            <span className="hint-icon">⚡</span>
            <span>Press E to interact</span>
          </div>
        )}
      </div>

      {/* Zone Progress - Bottom Right */}
      <div className="hud-progress">
        <div className="progress-title">Exploration Progress</div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${explorationProgress}%` }}
          />
        </div>
        <div className="progress-text">{explorationProgress}%</div>
        <div className="progress-zones">
          {Object.values(ZONE_CONFIG).map((zone) => (
            <div
              key={zone.id}
              className={`zone-progress-item ${zonesVisited.includes(zone.id) ? 'completed' : ''}`}
              title={zone.name}
              style={{
                backgroundColor: zone.color,
                opacity: zonesVisited.includes(zone.id) ? 1 : 0.3
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        .game-hud {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          font-family: 'Sora', system-ui, sans-serif;
          font-size: 14px;
          color: #fff;
          user-select: none;
        }

        /* Notifications */
        .notifications-container {
          position: fixed;
          top: 80px;
          right: 20px;
          z-index: 1001;
          pointer-events: auto;
        }

        .achievement-notification {
          background: rgba(10, 10, 20, 0.95);
          border: 2px solid #ffd700;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          backdrop-filter: blur(10px);
          max-width: 300px;
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
        }

        .notif-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .notif-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .notif-content strong {
          color: #ffd700;
          font-size: 14px;
        }

        .notif-content span {
          color: #aaa;
          font-size: 12px;
        }

          position: fixed;
          top: 20px;
          right: 20px;
          pointer-events: auto;
          background: rgba(10, 10, 20, 0.8);
          border: 2px solid #7fd6e0;
          border-radius: 8px;
          padding: 10px;
          backdrop-filter: blur(10px);
        }

        .minimap-background {
          width: 200px;
          height: 200px;
          background: rgba(20, 20, 40, 0.6);
          border-radius: 4px;
          margin-bottom: 8px;
        }

        .minimap-zone {
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .minimap-zone:hover {
          r: 18;
          filter: brightness(1.3);
        }

        .minimap-label {
          text-align: center;
          font-size: 12px;
          color: #7fd6e0;
          font-weight: bold;
        }

        .hud-objectives {
          position: fixed;
          top: 20px;
          left: 20px;
          pointer-events: auto;
          background: rgba(10, 10, 20, 0.85);
          border: 2px solid #ffb86b;
          border-radius: 8px;
          padding: 15px;
          width: 280px;
          backdrop-filter: blur(10px);
          max-height: 400px;
          overflow-y: auto;
        }

        .objectives-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          border-bottom: 1px solid #ffb86b;
          padding-bottom: 8px;
        }

        .objectives-header h3 {
          margin: 0;
          font-size: 16px;
          color: #ffb86b;
        }

        .close-btn {
          background: none;
          border: none;
          color: #ffb86b;
          cursor: pointer;
          font-size: 16px;
          pointer-events: auto;
        }

        .close-btn:hover {
          color: #ffd9a0;
        }

        .objectives-content {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .objective-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #ddd;
        }

        .objective-icon {
          font-size: 16px;
          min-width: 20px;
        }

        .hud-zone-info {
          position: fixed;
          bottom: 20px;
          left: 20px;
          pointer-events: auto;
          background: rgba(10, 10, 20, 0.85);
          border: 2px solid #7fd6e0;
          border-radius: 8px;
          padding: 15px;
          width: 320px;
          backdrop-filter: blur(10px);
        }

        .zone-info-header {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
          align-items: flex-start;
        }

        .zone-color-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 4px;
        }

        .zone-title h3 {
          margin: 0;
          font-size: 16px;
          color: #7fd6e0;
        }

        .zone-subtitle {
          margin: 4px 0 0 0;
          font-size: 12px;
          color: #aaa;
        }

        .zone-description {
          font-size: 12px;
          color: #bbb;
          line-height: 1.4;
          margin-bottom: 12px;
          padding: 8px;
          background: rgba(127, 214, 224, 0.05);
          border-radius: 4px;
        }

        .zone-status {
          display: flex;
          gap: 8px;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: bold;
          background: rgba(127, 214, 224, 0.2);
          color: #7fd6e0;
        }

        .status-badge.visited {
          background: rgba(139, 227, 165, 0.2);
          color: #8be3a5;
        }

        .hud-hints {
          position: fixed;
          bottom: 40%;
          left: 50%;
          transform: translateX(-50%);
          pointer-events: none;
        }

        .interaction-hint {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(127, 214, 224, 0.2);
          border: 1px solid #7fd6e0;
          border-radius: 4px;
          padding: 12px 16px;
          animation: pulse 1.5s infinite;
        }

        .hint-icon {
          font-size: 16px;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .hud-progress {
          position: fixed;
          bottom: 20px;
          right: 20px;
          pointer-events: auto;
          background: rgba(10, 10, 20, 0.85);
          border: 2px solid #8be3a5;
          border-radius: 8px;
          padding: 15px;
          width: 280px;
          backdrop-filter: blur(10px);
        }

        .progress-title {
          font-size: 14px;
          font-weight: bold;
          color: #8be3a5;
          margin-bottom: 10px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(139, 227, 165, 0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #7fd6e0, #8be3a5);
          transition: width 0.3s ease;
        }

        .progress-text {
          text-align: center;
          font-size: 12px;
          color: #8be3a5;
          font-weight: bold;
          margin-bottom: 10px;
        }

        .progress-zones {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 4px;
        }

        .zone-progress-item {
          width: 100%;
          height: 20px;
          border-radius: 4px;
          transition: all 0.3s ease;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .zone-progress-item.completed {
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 0 10px currentColor;
        }

        .zone-progress-item:hover {
          transform: scale(1.1);
          filter: brightness(1.3);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .hud-minimap {
            width: 140px;
            top: 10px;
            right: 10px;
          }

          .minimap-background {
            width: 140px;
            height: 140px;
          }

          .hud-objectives {
            width: 220px;
            left: 10px;
            top: 10px;
          }

          .hud-zone-info {
            width: 260px;
            left: 10px;
            bottom: 10px;
          }

          .hud-progress {
            width: 220px;
            right: 10px;
            bottom: 10px;
          }
        }
      `}</style>
    </div>
  );
}
