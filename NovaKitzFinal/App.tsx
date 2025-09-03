import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Animated,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Purchases from 'react-native-purchases';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [dreamKeywords, setDreamKeywords] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [novaResponse, setNovaResponse] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
        
        if (Platform.OS === 'ios') {
          await Purchases.configure({
            apiKey: 'appl_YOUR_APPLE_API_KEY_HERE',
          });
        } else if (Platform.OS === 'android') {
          await Purchases.configure({
            apiKey: 'goog_YOUR_GOOGLE_API_KEY_HERE',
          });
        }

        const customerInfo = await Purchases.getCustomerInfo();
        setIsPremium(customerInfo.entitlements.active['premium'] !== undefined);
      } catch (error: any) {
        console.error('RevenueCat init error:', error);
      }
    };

    initRevenueCat();
  }, []);

  const handlePurchase = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current?.availablePackages.length) {
        const purchaseMade = await Purchases.purchasePackage(offerings.current.availablePackages[0]);
        if (purchaseMade.customerInfo.entitlements.active['premium']) {
          setIsPremium(true);
          Alert.alert('Nova Kitz Premium', 'Welcome to the premium tea party! ✨');
        }
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Purchase Error', 'Unable to complete purchase. Please try again.');
      }
    }
  };

  const handleRestore = async () => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active['premium']) {
        setIsPremium(true);
        Alert.alert('Restored!', 'Your premium access has been restored! 🎉');
      } else {
        Alert.alert('No Purchases', 'No previous purchases found to restore.');
      }
    } catch (error: any) {
      Alert.alert('Restore Error', 'Unable to restore purchases. Please try again.');
    }
  };

  const handleAnalyze = async () => {
    if (!dreamKeywords.trim()) {
      Alert.alert('Nova Kitz', 'Spill your dream tea! Please enter some keywords.');
      return;
    }

    setIsLoading(true);
    setShowResponse(false);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      let response = '';
      if (isPremium) {
        response = `✨ PREMIUM ANALYSIS ✨\n\nOkay bestie, here's the premium tea... 🍵 Your dreams about "${dreamKeywords}" are deeply connected to your soul's journey! 🌟\n\n🔮 Deep Analysis: This dream reflects your subconscious processing of transformation and growth. The symbols suggest you're entering a powerful manifestation phase.\n\n💫 Cosmic Insights: Your dream energy aligns with lunar cycles of creativity and intuition. Trust your inner wisdom!\n\n🌙 Action Steps: Journal these insights, meditate on the symbols, and watch for synchronicities in your waking life!`;
      } else {
        response = `Okay bestie, here's the tea... 🍵 Your dreams about "${dreamKeywords}" are brewing with creative energy! ✨ This suggests your subconscious is processing new ideas and possibilities. 🌱 Trust the process and let your imagination flow! 🌙\n\n💎 Want deeper insights? Upgrade to Premium for cosmic-level dream analysis!`;
      }
      
      setNovaResponse(response);
      setShowResponse(true);
    } catch (error: any) {
      console.error('Error during dream analysis:', error);
      setNovaResponse("Sorry bestie, the tea leaves are a bit cloudy right now. Please try again later.");
      setShowResponse(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#7FB069" />
      
      <View style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Dream Orb */}
          <View style={styles.orbContainer}>
            <SmokeOrb />
          </View>

          {/* Main Content */}
          <View style={styles.contentContainer}>
            <View style={styles.glassPane}>
              <Text style={styles.title}>Nova Kitz</Text>
              <Text style={styles.subtitle}>What's brewing in your dreams?</Text>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={dreamKeywords}
                  onChangeText={setDreamKeywords}
                  placeholder="e.g., flying, ocean, white horse"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                />
                
                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleAnalyze}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? 'Brewing Analysis...' : 'Brew Analysis ✨'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Response */}
            {showResponse && (
              <Animated.View style={styles.responseContainer}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>🍵</Text>
                </View>
                <View style={styles.responseContent}>
                  <Text style={styles.responseTitle}>Nova's Message:</Text>
                  <Text style={styles.responseText}>{novaResponse}</Text>
                </View>
              </Animated.View>
            )}

            {/* Premium Section */}
            <View style={styles.premiumSection}>
              {isPremium ? (
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumText}>✨ Premium Member ✨</Text>
                </View>
              ) : (
                <View style={styles.subscriptionContainer}>
                  <Text style={styles.subscriptionTitle}>🌟 Unlock Premium Dream Analysis</Text>
                  <Text style={styles.subscriptionDescription}>
                    • Deep cosmic insights & symbolism analysis{'\n'}
                    • Personalized action steps{'\n'}
                    • Unlimited dream interpretations{'\n'}
                    • Advanced lunar cycle connections
                  </Text>
                  
                  <TouchableOpacity
                    style={styles.premiumButton}
                    onPress={handlePurchase}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.premiumButtonText}>Upgrade to Premium - $2.99/month</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.restoreButton}
                    onPress={handleRestore}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.restoreButtonText}>Restore Purchases</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
          
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// Smoke Orb Component with Native Animations
function SmokeOrb() {
  const smokeAnim1 = useRef(new Animated.Value(0)).current;
  const smokeAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Smoke animation 1
    const smokeAnimation1 = Animated.loop(
      Animated.sequence([
        Animated.timing(smokeAnim1, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(smokeAnim1, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ])
    );

    // Smoke animation 2 (offset)
    const smokeAnimation2 = Animated.loop(
      Animated.sequence([
        Animated.timing(smokeAnim2, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        }),
        Animated.timing(smokeAnim2, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ])
    );

    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    );

    // Rotation animation
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 25000,
        useNativeDriver: true,
      })
    );

    smokeAnimation1.start();
    setTimeout(() => smokeAnimation2.start(), 2000); // Start with delay
    pulseAnimation.start();
    rotateAnimation.start();

    return () => {
      smokeAnimation1.stop();
      smokeAnimation2.stop();
      pulseAnimation.stop();
      rotateAnimation.stop();
    };
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.dreamOrb, { transform: [{ scale: pulseAnim }] }]}>
      
      {/* Base gradient */}
      <View style={styles.orbGradient}>
        
        {/* Smoke layers */}
        <Animated.View 
          style={[
            styles.smokeLayer1,
            {
              transform: [
                { rotate: rotateInterpolate },
                { 
                  translateY: smokeAnim1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -100],
                  })
                }
              ],
              opacity: smokeAnim1.interpolate({
                inputRange: [0, 0.2, 0.8, 1],
                outputRange: [0, 0.8, 0.2, 0],
              }),
            }
          ]}
        />
        
        <Animated.View 
          style={[
            styles.smokeLayer2,
            {
              transform: [
                { rotate: rotateInterpolate },
                { 
                  translateY: smokeAnim2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, -80],
                  })
                }
              ],
              opacity: smokeAnim2.interpolate({
                inputRange: [0, 0.3, 0.7, 1],
                outputRange: [0, 0.6, 0.3, 0],
              }),
            }
          ]}
        />
        
        <Animated.View 
          style={[
            styles.smokeLayer3,
            {
              transform: [
                { rotate: rotateInterpolate },
                { 
                  translateY: smokeAnim1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, -60],
                  })
                }
              ],
              opacity: smokeAnim1.interpolate({
                inputRange: [0, 0.4, 0.6, 1],
                outputRange: [0, 0.4, 0.2, 0],
              }),
            }
          ]}
        />
        
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  gradient: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  orbContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  dreamOrb: {
    width: 300,
    height: 300,
    borderRadius: 150,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7FB069',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  orbGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 150,
    backgroundColor: 'rgba(127, 176, 105, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  smokeLayer1: {
    position: 'absolute',
    width: '60%',
    height: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 100,
    bottom: 0,
  },
  smokeLayer2: {
    position: 'absolute',
    width: '50%',
    height: '60%',
    backgroundColor: 'rgba(168, 213, 168, 0.6)',
    borderRadius: 80,
    bottom: 10,
  },
  smokeLayer3: {
    position: 'absolute',
    width: '35%',
    height: '50%',
    backgroundColor: 'rgba(247, 243, 233, 0.7)',
    borderRadius: 60,
    bottom: 20,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 400,
  },
  glassPane: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
    color: '#7FB069',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#6b7280',
    fontWeight: '500',
  },
  inputContainer: {
    gap: 16,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#d1d5db',
    minHeight: 80,
    textAlignVertical: 'top',
    color: '#374151',
  },
  button: {
    backgroundColor: '#7FB069',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#7FB069',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#a8d5a8',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  responseContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(127, 176, 105, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 24,
  },
  responseContent: {
    flex: 1,
  },
  responseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7FB069',
    marginBottom: 8,
  },
  responseText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  premiumSection: {
    marginTop: 32,
    marginBottom: 24,
  },
  premiumBadge: {
    backgroundColor: 'rgba(127, 176, 105, 0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#7FB069',
  },
  premiumText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7FB069',
  },
  subscriptionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  subscriptionTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    color: '#7FB069',
  },
  subscriptionDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    marginBottom: 24,
    textAlign: 'left',
  },
  premiumButton: {
    backgroundColor: '#7FB069',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#7FB069',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  premiumButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  restoreButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 12,
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7FB069',
    textAlign: 'center',
  },
});