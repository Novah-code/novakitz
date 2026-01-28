'use client';

import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface ImageUploadModalProps {
  user: User;
  language: 'en' | 'ko';
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImageUploadModal({ user, language, onClose, onSuccess }: ImageUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = {
    title: language === 'ko' ? '꿈 이미지 공유' : 'Share Dream Image',
    selectImage: language === 'ko' ? '이미지 선택' : 'Select Image',
    dragDrop: language === 'ko' ? '또는 여기에 드래그' : 'or drag and drop',
    caption: language === 'ko' ? '캡션 (선택)' : 'Caption (optional)',
    captionPlaceholder: language === 'ko' ? '꿈에 대해 짧게 적어주세요...' : 'Write briefly about your dream...',
    share: language === 'ko' ? '공유하기' : 'Share',
    uploading: language === 'ko' ? '업로드 중...' : 'Uploading...',
    cancel: language === 'ko' ? '취소' : 'Cancel',
    maxSize: language === 'ko' ? '최대 5MB' : 'Max 5MB',
    error: language === 'ko' ? '업로드 실패. 다시 시도해주세요.' : 'Upload failed. Please try again.',
    changeImage: language === 'ko' ? '이미지 변경' : 'Change image',
  };

  const handleFileSelect = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError(language === 'ko' ? '파일 크기는 5MB 이하여야 합니다.' : 'File size must be under 5MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError(language === 'ko' ? '이미지 파일만 업로드할 수 있습니다.' : 'Only image files are allowed.');
      return;
    }

    setError(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      // Generate unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('community-images')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('community-images')
        .getPublicUrl(fileName);

      // Create post record
      const { error: postError } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          caption: caption.trim() || null,
        });

      if (postError) throw postError;

      onSuccess();
    } catch (err) {
      console.error('Upload error:', err);
      setError(t.error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '2rem',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          border: '1px solid rgba(127, 176, 105, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}>
          <h2 style={{
            fontSize: '1.3rem',
            fontWeight: '600',
            color: 'var(--matcha-dark, #4a6741)',
            margin: 0,
          }}>
            {t.title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(127, 176, 105, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              color: 'var(--matcha-dark, #4a6741)',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Image Upload Area */}
        {!preview ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed rgba(127, 176, 105, 0.4)',
              borderRadius: '16px',
              padding: '3rem 2rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: 'rgba(127, 176, 105, 0.05)',
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--matcha-green, #7FB069)"
              strokeWidth="1.5"
              style={{ marginBottom: '1rem', opacity: 0.7 }}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p style={{
              color: 'var(--matcha-dark, #4a6741)',
              fontSize: '1rem',
              marginBottom: '0.5rem',
            }}>
              {t.selectImage}
            </p>
            <p style={{
              color: 'var(--sage, #6b8e63)',
              fontSize: '0.85rem',
              marginBottom: '0.25rem',
            }}>
              {t.dragDrop}
            </p>
            <p style={{
              color: 'var(--sage, #6b8e63)',
              fontSize: '0.75rem',
              opacity: 0.7,
            }}>
              {t.maxSize}
            </p>
          </div>
        ) : (
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <img
              src={preview}
              alt="Preview"
              style={{
                width: '100%',
                borderRadius: '16px',
                display: 'block',
              }}
            />
            <button
              onClick={() => {
                setSelectedFile(null);
                setPreview(null);
              }}
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.6)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                color: 'white',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {t.changeImage}
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
          style={{ display: 'none' }}
        />

        {/* Caption */}
        <div style={{ marginTop: '1rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.9rem',
            color: 'var(--matcha-dark, #4a6741)',
            marginBottom: '0.5rem',
          }}>
            {t.caption}
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={t.captionPlaceholder}
            maxLength={200}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid rgba(127, 176, 105, 0.3)',
              borderRadius: '12px',
              fontSize: '0.95rem',
              resize: 'none',
              height: '80px',
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
          <div style={{
            textAlign: 'right',
            fontSize: '0.75rem',
            color: 'var(--sage, #6b8e63)',
            marginTop: '4px',
          }}>
            {caption.length}/200
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(220, 53, 69, 0.1)',
            color: '#c0392b',
            padding: '10px 12px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginTop: '1rem',
          }}>
            {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '1.5rem',
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              background: 'rgba(127, 176, 105, 0.1)',
              border: 'none',
              borderRadius: '12px',
              color: 'var(--matcha-dark, #4a6741)',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            {t.cancel}
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            style={{
              flex: 1,
              padding: '12px',
              background: !selectedFile || uploading
                ? 'rgba(127, 176, 105, 0.3)'
                : 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: !selectedFile || uploading ? 'not-allowed' : 'pointer',
              boxShadow: !selectedFile || uploading ? 'none' : '0 4px 12px rgba(127, 176, 105, 0.3)',
            }}
          >
            {uploading ? t.uploading : t.share}
          </button>
        </div>
      </div>
    </div>
  );
}
