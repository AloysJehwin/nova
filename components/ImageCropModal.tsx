'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Crop as CropIcon, Check, RotateCcw } from 'lucide-react';
import ReactCrop, { type Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import toast from 'react-hot-toast';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (croppedImageUrl: string) => void;
}

export default function ImageCropModal({ isOpen, onClose, onSave }: ImageCropModalProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const hiddenAnchorRef = useRef<HTMLAnchorElement>(null);
  const blobUrlRef = useRef<string>('');

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || '');
      });
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1, // aspect ratio 1:1 for profile pictures
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  }, []);

  const getCroppedImg = useCallback(async () => {
    if (!imgRef.current || !completedCrop) {
      return;
    }

    setIsProcessing(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Set canvas size to desired output size (200x200 for profile pictures)
      const outputSize = 200;
      canvas.width = outputSize;
      canvas.height = outputSize;

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        outputSize,
        outputSize
      );

      return new Promise<string>((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              console.error('Canvas is empty');
              resolve('');
              return;
            }
            
            // Clean up previous blob URL
            if (blobUrlRef.current) {
              URL.revokeObjectURL(blobUrlRef.current);
            }
            
            blobUrlRef.current = URL.createObjectURL(blob);
            resolve(blobUrlRef.current);
          },
          'image/jpeg',
          0.9
        );
      });
    } catch (error) {
      console.error('Error cropping image:', error);
      toast.error('Failed to crop image');
      return '';
    } finally {
      setIsProcessing(false);
    }
  }, [completedCrop]);

  const handleSave = async () => {
    const croppedImageUrl = await getCroppedImg();
    if (croppedImageUrl) {
      onSave(croppedImageUrl);
      handleClose();
    }
  };

  const handleClose = () => {
    // Clean up
    setImageSrc('');
    setCrop(undefined);
    setCompletedCrop(undefined);
    setIsProcessing(false);
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = '';
    }
    onClose();
  };

  const resetImage = () => {
    setImageSrc('');
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <CropIcon className="w-6 h-6 text-purple-400" />
              Crop Profile Picture
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {!imageSrc ? (
            <div className="text-center py-12">
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 hover:border-purple-500 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300 text-lg mb-2">Choose an image to upload</p>
                <p className="text-gray-500 text-sm mb-4">Supports JPG, PNG, GIF (max 5MB)</p>
                <label className="inline-block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onSelectFile}
                    className="hidden"
                  />
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg px-6 py-3 cursor-pointer transition-all inline-block">
                    Select Image
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imageSrc}
                    style={{ maxHeight: '400px' }}
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetImage}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Choose Different Image
                </button>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!completedCrop || isProcessing}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {isProcessing ? 'Processing...' : 'Save Picture'}
                </button>
              </div>
            </div>
          )}

          {/* Hidden anchor for potential downloads */}
          <a
            ref={hiddenAnchorRef}
            download
            style={{ position: 'absolute', top: '-200vh' }}
            href="#hidden"
          >
            Hidden download
          </a>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}