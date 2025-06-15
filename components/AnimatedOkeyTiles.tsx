// components/AnimatedOkeyTiles.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Animated, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type ColorType = 'red' | 'black' | 'blue' | 'yellow';

interface TileData {
  id: number;
  value: number;
  color: ColorType;
  startX: number;
  delay: number;
  opacity: number;
  scale: number;
  fallDuration: number;
  rotationSpeed: number;
  rotationDirection: number; // 1 for clockwise, -1 for counterclockwise
}

interface OkeyTileProps {
  value: number;
  color: ColorType;
  startX: number;
  delay: number;
  opacity: number;
  scale: number;
  fallDuration: number;
  rotationSpeed: number;
  rotationDirection: number;
}

const OkeyTile: React.FC<OkeyTileProps> = ({ 
  value, 
  color, 
  startX,
  delay, 
  opacity, 
  scale,
  fallDuration,
  rotationSpeed,
  rotationDirection
}) => {
  const translateY = new Animated.Value(-100); // Start above screen
  const rotate = new Animated.Value(0);
  const fadeOpacity = new Animated.Value(0);

  const colorMap: Record<ColorType, string> = {
    red: '#dc2626',
    black: '#1f2937',
    blue: '#2563eb',
    yellow: '#ca8a04',
  };

  useEffect(() => {
    // Fade in
    Animated.timing(fadeOpacity, {
      toValue: opacity,
      duration: 1000,
      delay: delay * 1000,
      useNativeDriver: true,
    }).start();

    // Continuous fall down animation - seamless loop
    const fallAnimation = () => {
      translateY.setValue(-100);
      Animated.timing(translateY, {
        toValue: screenHeight + 100,
        duration: fallDuration,
        useNativeDriver: true,
      }).start(() => {
        // Immediately restart with no delay for continuous effect
        fallAnimation();
      });
    };

    // Continuous rotation animation - seamless loop
    const rotationAnimation = () => {
      Animated.loop(
        Animated.timing(rotate, {
          toValue: 1,
          duration: rotationSpeed,
          useNativeDriver: true,
        }),
        { iterations: -1 } // Infinite loop
      ).start();
    };

    // Start animations with initial delay only
    setTimeout(() => {
      fallAnimation();
      rotationAnimation();
    }, delay * 1000);

  }, [translateY, rotate, fadeOpacity, delay, fallDuration, rotationSpeed, opacity]);

  const rotateInterpolation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${360 * rotationDirection}deg`], // Use direction multiplier
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 48 * scale,
        height: 64 * scale,
        backgroundColor: '#fefce8',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fde047',
        left: startX,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        opacity: fadeOpacity,
        transform: [
          { translateY: translateY },
          { rotate: rotateInterpolation },
          { scale: scale }
        ],
      }}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ 
          fontSize: 20 * scale, 
          fontWeight: 'bold', 
          color: colorMap[color] 
        }}>
          {value}
        </Text>
      </View>
      <Text style={{ 
        position: 'absolute', 
        bottom: 4, 
        alignSelf: 'center', 
        fontSize: 12 * scale, 
        color: colorMap[color] 
      }}>
        ♥
      </Text>
    </Animated.View>
  );
};

const AnimatedOkeyTiles: React.FC = () => {
  const [tiles, setTiles] = useState<TileData[]>([]);

  useEffect(() => {
    const colors: ColorType[] = ['red', 'black', 'blue', 'yellow'];
    const newTiles: TileData[] = [];
    const usedXPositions: number[] = [];

    // Function to get a spread out X position
    const getSpreadOutXPosition = (): number => {
      const minDistance = 80; // Minimum distance between tiles
      const maxAttempts = 20;
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const newX = Math.random() * (screenWidth - 60);
        
        // Check if this position is far enough from existing positions
        const tooClose = usedXPositions.some(existingX => 
          Math.abs(newX - existingX) < minDistance
        );
        
        if (!tooClose) {
          usedXPositions.push(newX);
          return newX;
        }
      }
      
      // If we couldn't find a good position, just use a random one
      const fallbackX = Math.random() * (screenWidth - 60);
      usedXPositions.push(fallbackX);
      return fallbackX;
    };

    // Create 12 tiles with well-distributed positions and timing
    for (let i = 0; i < 12; i++) {
      const tileOpacity = 0.08 + Math.random() * 0.15; // Range from 0.08 to 0.23
      const tileScale = 0.7 + Math.random() * 0.4; // Range from 0.7 to 1.1
      
      newTiles.push({
        id: i,
        value: Math.floor(Math.random() * 13) + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        startX: getSpreadOutXPosition(), // Well-distributed X positions
        delay: (i * 3) + Math.random() * 2, // More spread out timing (every 3-5 seconds)
        opacity: tileOpacity,
        scale: tileScale,
        fallDuration: 12000 + Math.random() * 8000, // 12-20 seconds to fall
        rotationSpeed: 15000 + Math.random() * 10000, // 15-25 seconds per rotation
        rotationDirection: Math.random() < 0.5 ? 1 : -1, // Random direction: 50% clockwise, 50% counterclockwise
      });
    }

    setTiles(newTiles);
  }, []);

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
      {tiles.map((tile) => (
        <OkeyTile key={tile.id} {...tile} />
      ))}
    </View>
  );
};

export default AnimatedOkeyTiles;