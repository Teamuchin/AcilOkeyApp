// components/WigglingOkeyTile.tsx
import React, { useEffect } from 'react';
import { View, Text, Animated } from 'react-native';

interface WigglingOkeyTileProps {
  value?: number;
  size?: 'small' | 'medium' | 'large';
}

const WigglingOkeyTile: React.FC<WigglingOkeyTileProps> = ({ 
  value = 1, 
  size = 'small' 
}) => {
  const wiggleAnim = React.useRef(new Animated.Value(0)).current;

  const sizeMap = {
    small: { width: 32, height: 44, fontSize: 16, heartSize: 10 },
    medium: { width: 48, height: 64, fontSize: 20, heartSize: 12 },
    large: { width: 64, height: 88, fontSize: 28, heartSize: 16 },
  };

  const currentSize = sizeMap[size];

  useEffect(() => {
    const wiggleAnimation = () => {
      Animated.sequence([
        Animated.timing(wiggleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(wiggleAnim, {
          toValue: -1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(wiggleAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        wiggleAnimation();
      });
    };

    wiggleAnimation();

    return () => {
      wiggleAnim.stopAnimation();
    };
  }, []);

  const wiggleInterpolation = wiggleAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-8deg', '0deg', '8deg'],
  });

  return (
    <Animated.View
      style={{
        width: currentSize.width,
        height: currentSize.height,
        backgroundColor: '#fefce8',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#fde047',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 4,
        transform: [{ rotate: wiggleInterpolation }],
      }}
    >
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Text style={{ 
          fontSize: currentSize.fontSize, 
          fontWeight: 'bold', 
          color: '#dc2626',
          marginTop: -9
        }}>
          {value}
        </Text>
      </View>
      
      <Text style={{ 
        position: 'absolute', 
        bottom: 3, 
        alignSelf: 'center', 
        fontSize: currentSize.heartSize, 
        color: '#dc2626'
      }}>
        ♥
      </Text>
    </Animated.View>
  );
};

export default WigglingOkeyTile;