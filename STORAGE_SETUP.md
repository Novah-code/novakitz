# Supabase Storage Setup Guide

이 가이드는 Novakitz 앱에서 이미지를 Supabase Storage에 저장하도록 설정하는 방법을 설명합니다.

## 왜 Supabase Storage를 사용하나요?

이전에는 이미지를 base64로 인코딩하여 데이터베이스에 직접 저장했습니다. 이 방식은 여러 문제를 야기합니다:

1. **413 Payload Too Large 오류**: 여러 이미지를 업로드하면 요청 크기가 너무 커집니다
2. **데이터베이스 성능 저하**: 큰 텍스트 데이터가 데이터베이스를 느리게 만듭니다
3. **비용 증가**: 데이터베이스 스토리지가 불필요하게 증가합니다

Supabase Storage를 사용하면:
- 이미지가 별도의 객체 스토리지에 저장됩니다
- 데이터베이스에는 이미지 URL만 저장됩니다
- 자동 이미지 압축으로 대역폭을 절약합니다
- CDN을 통한 빠른 이미지 로딩이 가능합니다

## 설정 방법

### 1. Supabase 대시보드에서 Storage 버킷 생성

#### 옵션 A: SQL 에디터 사용 (권장)

1. Supabase 프로젝트 대시보드로 이동
2. 왼쪽 메뉴에서 **SQL Editor** 클릭
3. **New query** 클릭
4. `supabase-storage-setup.sql` 파일의 내용을 복사하여 붙여넣기
5. **Run** 버튼 클릭

#### 옵션 B: UI에서 수동 생성

1. Supabase 프로젝트 대시보드로 이동
2. 왼쪽 메뉴에서 **Storage** 클릭
3. **Create a new bucket** 버튼 클릭
4. 버킷 설정:
   - **Name**: `dream-images`
   - **Public bucket**: ✅ 체크 (공개 읽기 허용)
   - **File size limit**: 5 MB (선택사항)
   - **Allowed MIME types**: `image/*` (선택사항)
5. **Create bucket** 클릭

그 다음, RLS 정책을 설정해야 합니다:

1. **Storage** > **Policies** 로 이동
2. `dream-images` 버킷 선택
3. 다음 정책들을 추가:

**INSERT 정책 (업로드 허용)**:
```sql
CREATE POLICY "Users can upload their own dream images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'dream-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**UPDATE 정책 (수정 허용)**:
```sql
CREATE POLICY "Users can update their own dream images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'dream-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'dream-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**DELETE 정책 (삭제 허용)**:
```sql
CREATE POLICY "Users can delete their own dream images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'dream-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**SELECT 정책 (공개 읽기)**:
```sql
CREATE POLICY "Public can read dream images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'dream-images');
```

### 2. 코드 변경사항 확인

코드는 이미 업데이트되었습니다:

- ✅ `src/lib/imageStorage.ts` - 이미지 업로드/압축 유틸리티
- ✅ `src/components/SimpleDreamInterface.tsx` - Storage 사용하도록 수정

### 3. 테스트

1. 앱을 실행합니다:
   ```bash
   npm run dev
   ```

2. 로그인 후 새 꿈을 작성하고 이미지를 업로드합니다

3. Supabase 대시보드에서 확인:
   - **Storage** > **dream-images** 로 이동
   - 업로드된 이미지가 `{user_id}/{dream_id}_{timestamp}.jpg` 형식으로 저장되어 있는지 확인

4. 개발자 도구 콘솔에서 오류가 없는지 확인

## 이미지 저장 구조

```
dream-images/
└── {user_id}/
    ├── {dream_id}_1234567890.jpg
    ├── {dream_id}_1234567891.jpg
    └── ...
```

각 사용자의 이미지는 자신의 폴더에 저장되며, RLS 정책을 통해 다른 사용자가 접근할 수 없도록 보호됩니다.

## 이미지 압축 설정

기본 설정:
- **최대 너비**: 1200px
- **최대 높이**: 1200px
- **품질**: 80%
- **형식**: JPEG

설정을 변경하려면 `src/lib/imageStorage.ts`의 `compressImage` 함수 파라미터를 수정하세요.

## 기존 base64 이미지 마이그레이션 (선택사항)

기존에 base64로 저장된 이미지를 Storage로 마이그레이션하려면:

```typescript
import { migrateBase64ToStorage } from '@/lib/imageStorage';

// 각 꿈에 대해:
const newImageUrl = await migrateBase64ToStorage(
  dream.image, // base64 이미지
  userId,
  dreamId
);

// 데이터베이스 업데이트
await supabase
  .from('dreams')
  .update({ image: newImageUrl })
  .eq('id', dreamId);
```

## 문제 해결

### 413 Payload Too Large 오류가 여전히 발생하는 경우

- Storage 버킷이 올바르게 생성되었는지 확인
- RLS 정책이 활성화되어 있는지 확인
- 브라우저 콘솔에서 업로드 오류 메시지 확인

### 이미지가 표시되지 않는 경우

- 버킷이 **public**으로 설정되어 있는지 확인
- SELECT 정책이 올바르게 설정되어 있는지 확인
- 이미지 URL이 올바른지 확인 (브라우저에서 직접 열어보기)

### 업로드가 실패하는 경우

- 사용자가 로그인되어 있는지 확인
- INSERT 정책이 올바르게 설정되어 있는지 확인
- 파일 크기 제한을 확인 (기본: 50MB, 변경 가능)

## 참고 자료

- [Supabase Storage 문서](https://supabase.com/docs/guides/storage)
- [Supabase RLS 가이드](https://supabase.com/docs/guides/auth/row-level-security)
