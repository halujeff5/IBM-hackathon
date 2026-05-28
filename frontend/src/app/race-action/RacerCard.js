import React, { useState, useEffect } from 'react';
import { Box, Card, Typography } from '@mui/material';
import CompositionExample from './SpeedGauge';
import ThrottleExample from './ThrottleGauge';

export default function RacerCard({ position, name = 'LEC', speed = 0, brake = 0, gear = 1, throttle = 0, rpm = 0, disabled = false, raceFinished = false }) {
  const roundedSpeed = Math.round(Number(speed) || 0);
  const roundedThrottle = Math.round(Number(throttle) || 0);
  const [driverImageUrl, setDriverImageUrl] = useState('');

  useEffect(() => {
    // Load driver data and find matching driver
    fetch('/drivers.json')
      .then(res => res.json())
      .then(data => {
        const driver = data.drivers.find(d => d.driver === name);
        if (driver) {
          setDriverImageUrl(driver.url);
        }
      })
      .catch(err => console.error('Error loading driver data:', err));
  }, [name]);

  // Determine border color based on position (only show at end of race)
  const getBorderColor = () => {
    if (!raceFinished) return 'transparent';
    if (position === 1) return '#FFD700'; // Gold
    if (position === 2) return '#E8E8E8'; // Brighter Silver
    if (position === 3) return '#CD7F32'; // Bronze
    return 'transparent';
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {position && (
        <Typography
          component="span"
          sx={{
            color: '#14171a',
            fontFamily: '"Formula1 Display Bold", "Arial Black", Impact, sans-serif',
            fontSize: 48,
            fontWeight: 900,
            minWidth: 60,
            textAlign: 'right',
          }}
        >
          {position}
        </Typography>
      )}
      <Card
        sx={{
          width: '100%',
          minHeight: 120,
          display: 'flex',
          overflow: 'hidden',
          opacity: disabled ? 0.38 : 1,
          filter: disabled ? 'grayscale(1)' : 'none',
          border: `4px solid ${getBorderColor()}`,
          boxShadow: getBorderColor() !== 'transparent' ? `0 0 20px ${getBorderColor()}` : 'none',
        }}
      >
        <Box
          aria-label="Driver headshot"
          sx={{
            minWidth: 120,
            aspectRatio: '1',
            alignSelf: 'stretch',
            backgroundColor: '#9ca3af',
            backgroundImage: driverImageUrl ? `url(${driverImageUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      <Box
        sx={{
          alignSelf: 'center',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 2,
          minWidth: 142,
        }}
      >
        <Box
          sx={{
            minWidth: 78,
          }}
        >
          <Typography
            component="span"
            sx={{
              display: 'block',
              color: '#14171a',
              fontFamily: '"Formula1 Display Bold", "Arial Black", Impact, sans-serif',
              fontSize: 32,
              fontWeight: 800,
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </Typography>
          {disabled && (
            <Typography
              component="span"
              sx={{
                display: 'block',
                color: '#6b7280',
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontSize: 12,
                fontWeight: 900,
                whiteSpace: 'nowrap',
              }}
            >
              No Stream
            </Typography>
          )}
          <Typography
            component="span"
            sx={{
              display: 'block',
              color: '#14171a',
              fontFamily: 'Arial, Helvetica, sans-serif',
              fontSize: 14,
              fontWeight: 800,
              whiteSpace: 'nowrap',
            }}
          >
            {roundedSpeed} mph
          </Typography>
          <Typography
            component="span"
            sx={{
              display: 'block',
              color: brake === 1 ? '#ef4444' : '#14171a',
              fontFamily: 'Arial, Helvetica, sans-serif',
              fontSize: 14,
              fontWeight: 800,
              whiteSpace: 'nowrap',
              animation: brake === 1 ? 'flash 0.5s infinite' : 'none',
              '@keyframes flash': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.3 },
              },
            }}
          >
            Brake {brake}
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            ml: 1,
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: 0.75,
            }}
          >
            <Typography
              component="span"
              sx={{
                color: '#14171a',
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontSize: 14,
                fontWeight: 800,
                whiteSpace: 'nowrap',
              }}
            >
              Gear
            </Typography>
            <Typography
              component="span"
              sx={{
                color: '#14171a',
                fontFamily: '"Formula1 Display Bold", "Arial Black", Impact, sans-serif',
                fontSize: 30,
                fontWeight: 900,
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              {gear}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          minWidth: 0,
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <ThrottleExample value={roundedThrottle} />
          <Typography
            component="span"
            sx={{
              color: '#14171a',
              fontFamily: 'Arial, Helvetica, sans-serif',
              fontSize: 18,
              fontWeight: 700,
              mt: -1,
            }}
          >
            {roundedThrottle}%
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <CompositionExample value={roundedSpeed} />
          <Typography
            component="span"
            sx={{
              color: '#14171a',
              fontFamily: 'Arial, Helvetica, sans-serif',
              fontSize: 18,
              fontWeight: 700,
              mt: -1,
            }}
          >
            {roundedSpeed}
          </Typography>
        </Box>
      </Box>
    </Card>
    </Box>
  );
}
