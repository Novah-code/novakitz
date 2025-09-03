# Nova Kitz RevenueCat 구현 가이드

## 🔧 현재 구현된 핵심 코드

### 1. RevenueCat 초기화 (App.tsx 라인 27-50)
```typescript
useEffect(() => {
  const initRevenueCat = async () => {
    try {
      Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      
      if (Platform.OS === 'ios') {
        await Purchases.configure({
          apiKey: 'appl_YOUR_APPLE_API_KEY_HERE',  // 실제 키로 교체 필요
        });
      } else if (Platform.OS === 'android') {
        await Purchases.configure({
          apiKey: 'goog_YOUR_GOOGLE_API_KEY_HERE',  // 실제 키로 교체 필요
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
```

### 2. 구매 처리 함수 (App.tsx 라인 52-67)
```typescript
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
```

### 3. 구매 복원 함수 (App.tsx 라인 69-81)
```typescript
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
```

### 4. 프리미엄 기능 분기 처리 (App.tsx 라인 96-101)
```typescript
let response = '';
if (isPremium) {
  response = `✨ PREMIUM ANALYSIS ✨\n\n...심화 분석 내용...`;
} else {
  response = `기본 분석 내용...\n\n💎 Want deeper insights? Upgrade to Premium!`;
}
```

### 5. 프리미엄 UI 컴포넌트 (App.tsx 라인 169-202)
```typescript
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
```

## 📱 실제 운영을 위한 설정 단계

### 1. RevenueCat 계정 설정
1. https://app.revenuecat.com 회원가입
2. 새 프로젝트 생성: "Nova Kitz"  
3. API 키 발급:
   - iOS: `appl_xxxxxxxxxx`
   - Android: `goog_xxxxxxxxxx`

### 2. App Store Connect 설정 (iOS)
1. App Store Connect 로그인
2. "Nova Kitz" 앱 등록
3. 구독 상품 생성:
   - Product ID: `premium_monthly`
   - 가격: $2.99/월
   - Entitlement: `premium`

### 3. Google Play Console 설정 (Android)
1. Play Console 로그인
2. "Nova Kitz" 앱 등록  
3. 구독 상품 생성:
   - Product ID: `premium_monthly`
   - 가격: $2.99/월

### 4. 코드 업데이트
App.tsx에서 API 키 교체:
```typescript
// 실제 API 키로 교체
apiKey: 'appl_YOUR_REAL_APPLE_API_KEY'
apiKey: 'goog_YOUR_REAL_GOOGLE_API_KEY'
```

## 🧪 테스트 시나리오

### 기본 테스트
1. ✅ 앱 시작시 RevenueCat 초기화 확인
2. ✅ 무료 사용자 기본 분석 표시
3. ✅ 프리미엄 UI 표시 확인

### 구매 플로우 테스트  
1. "Upgrade to Premium" 버튼 클릭
2. 구독 상품 목록 표시 확인
3. 결제 진행 및 완료
4. 프리미엄 기능 활성화 확인
5. 심화 분석 컨텐츠 표시

### 복원 테스트
1. 앱 삭제 후 재설치
2. "Restore Purchases" 버튼 클릭  
3. 기존 구매 복원 확인
4. 프리미엄 상태 복구

## 🚨 주의사항

### 보안
- API 키를 코드에 하드코딩하지 말고 환경변수 사용 권장
- 프로덕션에서는 `LOG_LEVEL.DEBUG` 제거

### 에러 처리
- 네트워크 연결 실패 시 graceful degradation
- 구매 취소시 사용자 친화적 메시지
- 복원 실패시 명확한 안내

### 앱스토어 심사
- 구매 복원 기능 필수 구현 (완료)
- 구독 취소 안내 링크 제공 권장
- 개인정보 처리방침 업데이트

## 📋 체크리스트

### 개발 완료 ✅
- [x] RevenueCat SDK 설치
- [x] 구매 플로우 구현  
- [x] 복원 기능 구현
- [x] 프리미엄 기능 차별화
- [x] UI 구현 완료
- [x] TypeScript 오류 해결

### 배포 준비 ⏳
- [ ] Metro 호환성 이슈 해결
- [ ] 실제 API 키 설정
- [ ] 앱스토어 구독 상품 등록
- [ ] 실기기 테스트
- [ ] 앱스토어 제출

모든 코드가 준비되어 있어 Metro 이슈만 해결하면 바로 테스트 가능한 상태입니다! 🚀