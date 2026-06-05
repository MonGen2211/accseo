import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  Chip,
  Tooltip,
  IconButton,
  Alert,
  Card,
  CardContent,
  Divider,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  Slider,
  Tabs,
  Tab,
} from '@mui/material';

// Icons
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PlaceIcon from '@mui/icons-material/Place';
import SearchIcon from '@mui/icons-material/Search';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import MapIcon from '@mui/icons-material/Map';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import LabelIcon from '@mui/icons-material/Label';
import SettingsIcon from '@mui/icons-material/Settings';
import CodeIcon from '@mui/icons-material/Code';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined';

// Third party libs
import * as piexif from 'piexifjs';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useToastify } from '../../../components/Toastify';

interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
}

// Preset cities
interface CityPreset {
  name: string;
  lat: number;
  lng: number;
}

const CITY_PRESETS: CityPreset[] = [
  { name: 'Hà Nội', lat: 21.0285, lng: 105.8542 },
  { name: 'TP. Hồ Chí Minh', lat: 10.7769, lng: 106.7009 },
  { name: 'Đà Nẵng', lat: 16.0544, lng: 108.2022 },
  { name: 'Hải Phòng', lat: 20.8449, lng: 106.6881 },
  { name: 'Cần Thơ', lat: 10.0452, lng: 105.7469 },
  { name: 'Nha Trang', lat: 12.2388, lng: 109.1967 },
  { name: 'Huế', lat: 16.4637, lng: 107.5909 },
  { name: 'Vũng Tàu', lat: 10.4114, lng: 107.1362 },
  { name: 'Đà Lạt', lat: 11.9404, lng: 108.4583 },
  { name: 'Phú Quốc', lat: 10.2899, lng: 103.9840 },
  { name: 'Hạ Long', lat: 20.9101, lng: 107.1839 },
  { name: 'Sapa', lat: 22.3364, lng: 103.8438 },
];

const CAMERA_MODELS: Record<string, string[]> = {
  Canon: ['EOS R5', 'EOS R6 II', 'EOS R8', 'EOS R3', '5D Mark IV'],
  Nikon: ['Z9', 'Z7 II', 'Z6 II', 'D850', 'D780'],
  Sony: ['ILCE-7M4 (A7 IV)', 'ILCE-7RM5 (A7R V)', 'ILCE-7SM3 (A7S III)', 'ILCE-1 (A1)'],
  Fujifilm: ['X-T5', 'X-H2S', 'GFX 100 II', 'X100VI'],
  Panasonic: ['Lumix S5 II', 'Lumix GH6', 'Lumix G9 II'],
  'OM System': ['OM-1', 'OM-5'],
  Leica: ['Q3', 'M11', 'SL3'],
  Apple: ['iPhone 15 Pro', 'iPhone 15 Pro Max', 'iPhone 14 Pro', 'iPhone 13 Pro'],
};

const EDITING_SOFTWARES = [
  'Adobe Photoshop Lightroom',
  'Adobe Photoshop',
  'Capture One Pro',
  'Snapseed',
  'VSCO',
];

const SEO_PRESETS = {
  titles: [
    'Sản phẩm chụp studio cao cấp',
    'Thiết kế nội thất phòng khách hiện đại',
    'Dịch vụ luật sư tư vấn ly hôn uy tín',
    'Bảng giá thi công nhà trọn gói 2026',
    'Khóa học đào tạo SEO bài bản',
    'Dịch vụ SEO tổng thể từ khóa lên Top',
  ],
  subjects: [
    'Chụp ảnh sản phẩm chuyên nghiệp',
    'Thiết kế nội thất đẹp',
    'Tư vấn pháp luật',
    'Xây dựng dân dụng',
    'Đào tạo SEO chuyên sâu',
    'SEO Marketing',
  ],
  keywords: [
    'chụp ảnh sản phẩm, studio, chuyên nghiệp, thiết kế, quảng cáo',
    'nội thất phòng khách, sofa gỗ, thiết kế nội thất, nhà đẹp',
    'luật sư ly hôn, thủ tục ly hôn, tư vấn luật sư, ly hôn nhanh',
    'xây nhà trọn gói, thi công nhà phố, báo giá xây dựng',
    'học seo, đào tạo seo, khóa học seo, seo top google',
    'dịch vụ seo, seo từ khóa, seo tổng thể, tối ưu website',
  ],
  comments: [
    'Được chụp bởi nhiếp ảnh gia chuyên nghiệp tại studio.',
    'Không gian phòng khách hiện đại thiết kế tối giản sang trọng.',
    'Dịch vụ hỗ trợ tư vấn pháp lý chuyên nghiệp, tận tâm.',
    'Công trình thi công thực tế chất lượng cao bởi đội ngũ kỹ sư giàu kinh nghiệm.',
    'Học viên được thực hành trực tiếp trên dự án thực tế.',
    'Chiến lược tối ưu hóa công cụ tìm kiếm giúp tăng trưởng doanh thu vượt bậc.',
  ],
  authors: [
    'Nhiếp ảnh gia chuyên nghiệp',
    'Studio Nhà Xinh',
    'Văn phòng Luật sư ACC',
    'Công ty Xây dựng An Cư',
    'Trung tâm Đào tạo SEO',
    'Đội ngũ ACCSEO Marketing',
  ],
  copyrights: [
    'Bản quyền thuộc về ACCSEO Studio 2026',
    'Bản quyền thuộc về ACC Group 2026',
    'Bản quyền thuộc về Nội Thất Nhà Việt 2026',
    'Bản quyền hình ảnh sở hữu bởi Luật ACC 2026',
  ]
};

// Remove Vietnamese tones
const removeVietnameseTones = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

// Helper for UTF-16 encoding byte array for XP metadata tags in EXIF
const stringToUtf16Bytes = (str: string): number[] => {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    bytes.push(code & 0xff);
    bytes.push((code >> 8) & 0xff);
  }
  // Null terminator (2 bytes)
  bytes.push(0, 0);
  return bytes;
};

// Helper to convert Unicode strings to a Latin1 binary string (for Ascii EXIF tags)
const toUtf8BinaryString = (str: string): string => {
  if (!str) return '';
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
};

// Decimal to DMS conversion
const decimalToDMS = (val: number, refType: 'lat' | 'lng'): string => {
  const absolute = Math.abs(val);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(2);
  
  let direction = '';
  if (refType === 'lat') {
    direction = val >= 0 ? 'N' : 'S';
  } else {
    direction = val >= 0 ? 'E' : 'W';
  }
  
  return `${degrees}°${minutes}'${seconds}"${direction}`;
};

export default function GeoTagSection() {
  const { showToast } = useToastify();

  // Active Images
  const [images, setImages] = useState<ImageFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // GPS States
  const [latitude, setLatitude] = useState<number>(21.0285);
  const [longitude, setLongitude] = useState<number>(105.8542);
  const [altitude, setAltitude] = useState<number>(0);
  const [presetSearch, setPresetSearch] = useState<string>('');

  // SEO Metadata States
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [keywords, setKeywords] = useState('');
  const [extraKeywords, setExtraKeywords] = useState('');
  const [comments, setComments] = useState('');
  const [author, setAuthor] = useState('');
  const [copyright, setCopyright] = useState('');
  const [dateTaken, setDateTaken] = useState('');

  // Camera States
  const [cameraMake, setCameraMake] = useState('Canon');
  const [cameraModel, setCameraModel] = useState('EOS R5');
  const [editingSoftware, setEditingSoftware] = useState('Adobe Photoshop Lightroom');

  // Toggle Switches
  const [clearOriginalExif, setClearOriginalExif] = useState(true);
  const [useFileNameAsTitle, setUseFileNameAsTitle] = useState(false);
  const [stripAccents, setStripAccents] = useState(true);
  const [spaceToDash, setSpaceToDash] = useState(true);
  const [authorInComment, setAuthorInComment] = useState(false);
  const [authorInTitle, setAuthorInTitle] = useState(false);
  const [rating5Stars, setRating5Stars] = useState(true);
  const [compressImage, setCompressImage] = useState(false);
  const [compressionQuality, setCompressionQuality] = useState<number>(90);

  // Resize States
  const [resizeImage, setResizeImage] = useState(false);
  const [resizeWidth, setResizeWidth] = useState<number>(800);
  const [resizeHeight, setResizeHeight] = useState<number>(800);
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [resizePreset, setResizePreset] = useState('custom');

  // Extension/Format States
  const [outputFormat, setOutputFormat] = useState<'jpeg' | 'webp' | 'png'>('jpeg');

  // Filename Pattern States
  const [filenamePattern, setFilenamePattern] = useState<'original' | 'seo-title' | 'seo-keywords'>('original');

  // Live preview tabs
  const [previewTab, setPreviewTab] = useState(0);

  // Progress State
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  // Watermark States
  const [addWatermark, setAddWatermark] = useState(false);
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkPosition, setWatermarkPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center'>('bottom-right');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(40);

  // Saved Stats State
  const [savedStats, setSavedStats] = useState<{ originalSize: number; optimizedSize: number; count: number } | null>(null);

  // Reset stats when images change
  useEffect(() => {
    setSavedStats(null);
  }, [images]);

  // Set default model on make change
  useEffect(() => {
    if (CAMERA_MODELS[cameraMake]) {
      setCameraModel(CAMERA_MODELS[cameraMake][0]);
    }
  }, [cameraMake]);

  // Dropzone drag-drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFiles = (files: FileList) => {
    const newImages: ImageFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        showToast(`File "${file.name}" vượt quá 10MB và bị bỏ qua.`, 'warning');
        continue;
      }
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        showToast(`File "${file.name}" không đúng định dạng ảnh được hỗ trợ.`, 'danger');
        continue;
      }
      newImages.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
      });
    }
    setImages((prev) => [...prev, ...newImages]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleDeleteImage = (id: string, url: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    URL.revokeObjectURL(url);
  };

  // Preset loading helpers
  const handleApplyPreset = (preset: CityPreset) => {
    setLatitude(preset.lat);
    setLongitude(preset.lng);
    showToast(`Đã áp dụng tọa độ thành phố: ${preset.name}`, 'info');
  };

  const handleRandomSeo = () => {
    function rand<T>(arr: T[]): T {
      return arr[Math.floor(Math.random() * arr.length)];
    }
    setTitle(rand(SEO_PRESETS.titles));
    setSubject(rand(SEO_PRESETS.subjects));
    setKeywords(rand(SEO_PRESETS.keywords));
    setComments(rand(SEO_PRESETS.comments));
    setAuthor(rand(SEO_PRESETS.authors));
    setCopyright(rand(SEO_PRESETS.copyrights));
    showToast('Đã điền ngẫu nhiên thông tin SEO Metadata!', 'success');
  };

  const handleRandomDevice = () => {
    const makes = Object.keys(CAMERA_MODELS);
    const randMake = makes[Math.floor(Math.random() * makes.length)];
    const models = CAMERA_MODELS[randMake];
    const randModel = models[Math.floor(Math.random() * models.length)];
    const randSoftware = EDITING_SOFTWARES[Math.floor(Math.random() * EDITING_SOFTWARES.length)];

    setCameraMake(randMake);
    setTimeout(() => {
      setCameraModel(randModel);
    }, 50);
    setEditingSoftware(randSoftware);
    showToast('Đã điền ngẫu nhiên thông tin camera!', 'success');
  };

  const handleRandomAll = () => {
    handleRandomSeo();
    handleRandomDevice();
  };

  // Filter city presets
  const filteredPresets = CITY_PRESETS.filter((p) =>
    removeVietnameseTones(p.name.toLowerCase()).includes(removeVietnameseTones(presetSearch.toLowerCase()))
  );

  // Dynamic values based on options
  const finalTitle = useFileNameAsTitle ? 'Tên file gốc' : title;
  const computedKeywords = [keywords, extraKeywords].filter(Boolean).join(', ');

  // DMS string
  const dmsLat = decimalToDMS(latitude, 'lat');
  const dmsLng = decimalToDMS(longitude, 'lng');

  // Preview JSON Object
  const previewExifObj = {
    OutputFormat: outputFormat.toUpperCase(),
    EXIFStatus: outputFormat === 'jpeg' ? 'Co EXIF & GPS (Khuyen dung SEO)' : 'Khong (Format nay khong ho tro EXIF)',
    ImageDescription: finalTitle + (authorInTitle && author ? ` - ${author}` : ''),
    Artist: author,
    Copyright: copyright,
    XPTitle: finalTitle,
    XPSubject: subject,
    XPKeywords: computedKeywords,
    XPComment: comments + (authorInComment && author ? ` | Author: ${author}` : ''),
    Make: cameraMake,
    Model: cameraModel,
    Software: editingSoftware,
    DateTimeOriginal: dateTaken ? dateTaken.replace(/-/g, ':').replace('T', ' ') + ':00' : 'Không ghi',
    Rating: rating5Stars ? 5 : undefined,
    GPSLatitude: latitude.toFixed(6) + ' (' + dmsLat + ')',
    GPSLongitude: longitude.toFixed(6) + ' (' + dmsLng + ')',
    GPSAltitude: altitude + 'm',
    Watermark: addWatermark && watermarkText ? `Co ("${watermarkText}" tai ${watermarkPosition})` : 'Khong',
  };

  // ExifTool Command Preview
  const makeExifToolCmd = () => {
    const parts = ['exiftool'];
    if (finalTitle) parts.push(`-ImageDescription="${finalTitle}"`, `-XPTitle="${finalTitle}"`);
    if (author) parts.push(`-Artist="${author}"`);
    if (copyright) parts.push(`-Copyright="${copyright}"`);
    if (subject) parts.push(`-XPSubject="${subject}"`);
    if (computedKeywords) parts.push(`-XPKeywords="${computedKeywords}"`);
    if (comments) parts.push(`-XPComment="${comments}"`);
    if (cameraMake) parts.push(`-Make="${cameraMake}"`);
    if (cameraModel) parts.push(`-Model="${cameraModel}"`);
    if (editingSoftware) parts.push(`-Software="${editingSoftware}"`);
    if (dateTaken) {
      const formattedDate = dateTaken.replace(/-/g, ':').replace('T', ' ') + ':00';
      parts.push(`-DateTimeOriginal="${formattedDate}"`);
    }
    if (rating5Stars) parts.push(`-Rating=5`);
    parts.push(`-GPSLatitude=${Math.abs(latitude)} -GPSLatitudeRef=${latitude >= 0 ? 'N' : 'S'}`);
    parts.push(`-GPSLongitude=${Math.abs(longitude)} -GPSLongitudeRef=${longitude >= 0 ? 'E' : 'W'}`);
    parts.push(`-GPSAltitude=${Math.abs(altitude)} -GPSAltitudeRef=${altitude >= 0 ? 0 : 1}`);
    parts.push('image.jpg');
    return parts.join(' ');
  };

  // Processing function
  const handleProcessImages = async () => {
    if (images.length === 0 || progress !== null) return;
    
    setProgress({ current: 0, total: images.length });

    const zip = new JSZip();
    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;

    try {
      for (let i = 0; i < images.length; i++) {
        setProgress({ current: i + 1, total: images.length });
        const imgFile = images[i];
        totalOriginalSize += imgFile.file.size;

        // 1. Load File content as DataURL
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error(`Không thể đọc file: ${imgFile.name}`));
          reader.readAsDataURL(imgFile.file);
        });

        // Detect original EXIF Orientation
        let originalOrientation = 1;
        const isJpeg = imgFile.file.type === 'image/jpeg' || imgFile.file.type === 'image/jpg';
        if (isJpeg) {
          try {
            const exifData = piexif.load(base64Data);
            if (exifData && exifData["0th"] && exifData["0th"][piexif.ImageIFD.Orientation]) {
              originalOrientation = exifData["0th"][piexif.ImageIFD.Orientation];
            }
          } catch (e) {
            // No EXIF orientation or parsing failed
          }
        }

        // 2. Remove Exif if enabled (only for JPEGs since piexif fails to parse png/webp exif removal)
        let targetBase64 = base64Data;
        if (clearOriginalExif && isJpeg) {
          try {
            targetBase64 = piexif.remove(targetBase64);
          } catch (e) {
            console.warn('Remove EXIF failed or EXIF not present:', e);
          }
        }

        // 3. Compress/Resize/Convert format on canvas + Watermark + Auto-orientation
        const needCanvas = compressImage || resizeImage || addWatermark || outputFormat !== 'jpeg' || !isJpeg || originalOrientation !== 1;
        if (needCanvas) {
          const quality = compressImage ? compressionQuality / 100 : 0.95;
          targetBase64 = await new Promise<string>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let w = img.naturalWidth;
              let h = img.naturalHeight;

              if (resizeImage) {
                if (keepAspectRatio) {
                  const ratio = w / h;
                  if (resizeWidth && !resizeHeight) {
                    w = resizeWidth;
                    h = Math.round(w / ratio);
                  } else if (!resizeWidth && resizeHeight) {
                    h = resizeHeight;
                    w = Math.round(h * ratio);
                  } else if (resizeWidth && resizeHeight) {
                    const scale = Math.min(resizeWidth / w, resizeHeight / h);
                    w = Math.round(w * scale);
                    h = Math.round(h * scale);
                  }
                } else {
                  if (resizeWidth) w = resizeWidth;
                  if (resizeHeight) h = resizeHeight;
                }
              }

              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                reject(new Error('Không tạo được context canvas'));
                return;
              }
              ctx.drawImage(img, 0, 0, w, h);

              // Draw Watermark if enabled
              if (addWatermark && watermarkText) {
                ctx.save();
                const fontSize = Math.max(12, Math.round(w * 0.025));
                ctx.font = `bold ${fontSize}px sans-serif`;
                ctx.fillStyle = `rgba(255, 255, 255, ${watermarkOpacity / 100})`;
                ctx.strokeStyle = `rgba(0, 0, 0, ${watermarkOpacity / 200})`;
                ctx.lineWidth = Math.max(1, Math.round(fontSize * 0.15));
                ctx.textBaseline = 'middle';

                const textWidth = ctx.measureText(watermarkText).width;
                const margin = fontSize;
                let x = w - textWidth - margin;
                let y = h - margin;

                if (watermarkPosition === 'bottom-left') {
                  x = margin;
                  y = h - margin;
                } else if (watermarkPosition === 'top-right') {
                  x = w - textWidth - margin;
                  y = margin;
                } else if (watermarkPosition === 'top-left') {
                  x = margin;
                  y = margin;
                } else if (watermarkPosition === 'center') {
                  x = (w - textWidth) / 2;
                  y = h / 2;
                }

                ctx.strokeText(watermarkText, x, y);
                ctx.fillText(watermarkText, x, y);
                ctx.restore();
              }

              const format = outputFormat === 'webp' ? 'image/webp' : outputFormat === 'png' ? 'image/png' : 'image/jpeg';
              const compressedBase64 = canvas.toDataURL(format, quality);
              resolve(compressedBase64);
            };
            img.onerror = () => reject(new Error(`Lỗi tải ảnh lên canvas: ${imgFile.name}`));
            img.src = base64Data; // Load the original base64 to preserve EXIF orientation for browser auto-orientation
          });
        }

        // 4. Generate EXIF structure
        const zeroth: any = {};
        const exif: any = {};
        const gps: any = {};

        // Version ID
        gps[piexif.GPSIFD.GPSVersionID] = [2, 3, 0, 0];

        // GPS Coordinates rational encoding
        gps[piexif.GPSIFD.GPSLatitudeRef] = latitude >= 0 ? 'N' : 'S';
        gps[piexif.GPSIFD.GPSLatitude] = piexif.GPSHelper.degToDmsRational(Math.abs(latitude));
        gps[piexif.GPSIFD.GPSLongitudeRef] = longitude >= 0 ? 'E' : 'W';
        gps[piexif.GPSIFD.GPSLongitude] = piexif.GPSHelper.degToDmsRational(Math.abs(longitude));
        gps[piexif.GPSIFD.GPSAltitudeRef] = altitude >= 0 ? 0 : 1;
        gps[piexif.GPSIFD.GPSAltitude] = [Math.round(Math.abs(altitude)), 1];

        // Apply metadata tags
        const resolvedTitle = useFileNameAsTitle
          ? imgFile.name.substring(0, imgFile.name.lastIndexOf('.')) || imgFile.name
          : title;

        const titleText = resolvedTitle + (authorInTitle && author ? ` - ${author}` : '');
        const commentText = comments + (authorInComment && author ? ` | Author: ${author}` : '');

        if (titleText) {
          zeroth[piexif.ImageIFD.ImageDescription] = toUtf8BinaryString(titleText);
          zeroth[piexif.ImageIFD.XPTitle] = stringToUtf16Bytes(titleText);
        }
        if (author) {
          zeroth[piexif.ImageIFD.Artist] = toUtf8BinaryString(author);
        }
        if (copyright) {
          zeroth[piexif.ImageIFD.Copyright] = toUtf8BinaryString(copyright);
        }
        if (subject) {
          zeroth[piexif.ImageIFD.XPSubject] = stringToUtf16Bytes(subject);
        }
        if (computedKeywords) {
          zeroth[piexif.ImageIFD.XPKeywords] = stringToUtf16Bytes(computedKeywords);
        }
        if (commentText) {
          zeroth[piexif.ImageIFD.XPComment] = stringToUtf16Bytes(commentText);
          exif[piexif.ExifIFD.UserComment] = toUtf8BinaryString(commentText);
        }
        if (cameraMake) {
          zeroth[piexif.ImageIFD.Make] = toUtf8BinaryString(cameraMake);
        }
        if (cameraModel) {
          zeroth[piexif.ImageIFD.Model] = toUtf8BinaryString(cameraModel);
        }
        if (editingSoftware) {
          zeroth[piexif.ImageIFD.Software] = toUtf8BinaryString(editingSoftware);
        }
        if (rating5Stars) {
          zeroth[piexif.ImageIFD.Rating] = 5;
        }
        if (dateTaken) {
          const formattedDate = dateTaken.replace(/-/g, ':').replace('T', ' ') + ':00';
          exif[piexif.ExifIFD.DateTimeOriginal] = toUtf8BinaryString(formattedDate);
        }

        const exifObj = {
          '0th': zeroth,
          Exif: exif,
          GPS: gps,
        };

        // 5. Insert EXIF back into image (only for JPEG format)
        let outputBase64 = targetBase64;
        if (outputFormat === 'jpeg') {
          try {
            const exifBytes = piexif.dump(exifObj);
            outputBase64 = piexif.insert(exifBytes, targetBase64);
          } catch (e) {
            console.error('Lỗi chèn EXIF:', e);
          }
        }

        // Convert base64 back to Blob
        const byteString = atob(outputBase64.split(',')[1]);
        const mimeString = outputBase64.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let j = 0; j < byteString.length; j++) {
          ia[j] = byteString.charCodeAt(j);
        }
        const blob = new Blob([ab], { type: mimeString });
        totalOptimizedSize += blob.size;

        // Target File Name transformations
        let targetName = imgFile.name;
        const dotIndex = targetName.lastIndexOf('.');
        let nameWithoutExt = dotIndex !== -1 ? targetName.substring(0, dotIndex) : targetName;

        if (filenamePattern === 'seo-title' && title.trim()) {
          nameWithoutExt = title.trim();
        } else if (filenamePattern === 'seo-keywords' && keywords.trim()) {
          const firstKeyword = keywords.split(',')[0].trim();
          if (firstKeyword) {
            nameWithoutExt = firstKeyword;
          }
        }

        // Exporter options
        if (stripAccents) {
          nameWithoutExt = removeVietnameseTones(nameWithoutExt);
        }
        if (spaceToDash) {
          nameWithoutExt = nameWithoutExt
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        }

        // Fallback to original name if empty
        if (!nameWithoutExt.trim()) {
          nameWithoutExt = dotIndex !== -1 ? targetName.substring(0, dotIndex) : targetName;
          if (stripAccents) {
            nameWithoutExt = removeVietnameseTones(nameWithoutExt);
          }
          if (spaceToDash) {
            nameWithoutExt = nameWithoutExt
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-');
          }
        }

        const finalExtension = outputFormat === 'webp' ? 'webp' : outputFormat === 'png' ? 'png' : 'jpg';
        const finalFileName = `${nameWithoutExt}.${finalExtension}`;

        if (images.length === 1) {
          saveAs(blob, finalFileName);
        } else {
          zip.file(finalFileName, blob);
        }
      }

      if (images.length > 1) {
        showToast('Đang nén file ZIP để tải về...', 'info');
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, `geotagged_images_${Date.now()}.zip`);
      }

      setSavedStats({
        originalSize: totalOriginalSize,
        optimizedSize: totalOptimizedSize,
        count: images.length,
      });

      showToast('Đã xử lý và tải ảnh thành công!', 'success');
    } catch (err: any) {
      console.error('Process error:', err);
      showToast(err.message || 'Gặp lỗi trong quá trình xử lý ảnh', 'danger');
    } finally {
      setProgress(null);
    }
  };

  return (
    <Grid container spacing={3.5}>
      {/* Col 1: Main Control Panel */}
      <Grid item xs={12} lg={8}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          
          {/* Static privacy banner */}
          <Alert severity="success" variant="outlined" sx={{ borderRadius: 3, borderStyle: 'dashed' }}>
            🔒 <strong>100% riêng tư:</strong> Ảnh được xử lý hoàn toàn trong bộ nhớ trình duyệt của bạn, không upload lên bất kỳ máy chủ nào.
          </Alert>

          {/* 1. File Upload Dropzone */}
          <Paper
            elevation={0}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            sx={{
              p: 4,
              borderRadius: 4,
              border: '2px dashed',
              borderColor: images.length > 0 ? 'success.main' : 'divider',
              bgcolor: 'background.paper',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              '&:hover': {
                borderColor: 'primary.main',
              },
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            />
            <AddPhotoAlternateIcon sx={{ fontSize: 50, color: 'text.secondary', mb: 1.5, opacity: 0.7 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Kéo thả nhiều ảnh vào đây hoặc click để chọn ảnh
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Hỗ trợ: JPEG, PNG, WebP, GIF (tối đa 10MB/ảnh) - Tự động convert sang JPG để giữ thẻ EXIF.
            </Typography>
          </Paper>

          {/* Thumbnail list (rendered if any) */}
          {images.length > 0 && (
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 1.5 }}>
                DANH SÁCH ẢNH ĐANG CHỜ XỬ LÝ ({images.length} ẢNH)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {images.map((img) => (
                  <Box
                    key={img.id}
                    sx={{
                      position: 'relative',
                      width: 90,
                      height: 90,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={img.previewUrl}
                      alt={img.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage(img.id, img.previewUrl);
                      }}
                      sx={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        bgcolor: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        p: 0.3,
                        '&:hover': { bgcolor: 'rgba(214, 48, 49, 0.9)' },
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* 2. GPS Location Configuration */}
          <Paper elevation={0} sx={{ p: 3.5, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PlaceIcon color="primary" /> 📍 Vị trí GPS & Địa điểm
            </Typography>

            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Vĩ độ (Latitude)"
                  type="number"
                  inputProps={{ step: 'any' }}
                  fullWidth
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Kinh độ (Longitude)"
                  type="number"
                  inputProps={{ step: 'any' }}
                  fullWidth
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Độ cao (m)"
                  type="number"
                  fullWidth
                  value={altitude}
                  onChange={(e) => setAltitude(parseInt(e.target.value) || 0)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
            </Grid>

            {/* Quick search and preset chips */}
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', mb: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                  CHỌN ĐỊA ĐIỂM PRESET NHANH
                </Typography>
                <TextField
                  placeholder="Lọc tỉnh thành..."
                  size="small"
                  variant="outlined"
                  value={presetSearch}
                  onChange={(e) => setPresetSearch(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: <SearchIcon sx={{ color: 'text.secondary', fontSize: 16, mr: 0.5 }} />
                    }
                  }}
                  sx={{
                    width: 180,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      height: 32,
                      fontSize: '0.8rem',
                    },
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {filteredPresets.map((preset) => (
                  <Chip
                    key={preset.name}
                    label={preset.name}
                    clickable
                    onClick={() => handleApplyPreset(preset)}
                    variant="outlined"
                    sx={{ borderRadius: 2, fontWeight: 600 }}
                  />
                ))}
                {filteredPresets.length === 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Không tìm thấy tỉnh thành nào khớp từ khóa.
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>

          {/* 3. SEO Metadata Information */}
          <Paper elevation={0} sx={{ p: 3.5, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LabelIcon color="primary" /> 🏷️ Thông tin SEO Metadata
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.25 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ShuffleIcon />}
                  onClick={handleRandomSeo}
                  sx={{ textTransform: 'none', borderRadius: 2.5, fontWeight: 700 }}
                >
                  Random SEO
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ShuffleIcon />}
                  onClick={handleRandomAll}
                  sx={{ textTransform: 'none', borderRadius: 2.5, fontWeight: 700 }}
                >
                  Random tất cả
                </Button>
              </Box>
            </Box>

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Title (Tiêu đề ảnh)"
                  fullWidth
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={useFileNameAsTitle}
                  helperText={useFileNameAsTitle ? 'Đang dùng tên file gốc làm tiêu đề' : ''}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {SEO_PRESETS.titles.slice(0, 3).map((t, idx) => (
                    <Chip key={idx} label={t} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} onClick={() => !useFileNameAsTitle && setTitle(t)} />
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Subject (Chủ đề)"
                  fullWidth
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {SEO_PRESETS.subjects.slice(0, 3).map((s, idx) => (
                    <Chip key={idx} label={s} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} onClick={() => setSubject(s)} />
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Keywords (Từ khóa chính - cách nhau bởi dấu phẩy)"
                  fullWidth
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {SEO_PRESETS.keywords.slice(0, 3).map((k, idx) => (
                    <Chip key={idx} label={k.substring(0, 40) + '...'} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} onClick={() => setKeywords(k)} />
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Keywords bổ sung"
                  fullWidth
                  value={extraKeywords}
                  onChange={(e) => setExtraKeywords(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Ngày chụp ảnh"
                  type="datetime-local"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={dateTaken}
                  onChange={(e) => setDateTaken(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Comments (Bình luận / Chú thích)"
                  fullWidth
                  multiline
                  rows={2}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Author (Tác giả)"
                  fullWidth
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {SEO_PRESETS.authors.slice(0, 3).map((a, idx) => (
                    <Chip key={idx} label={a} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} onClick={() => setAuthor(a)} />
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Copyright (Bản quyền)"
                  fullWidth
                  value={copyright}
                  onChange={(e) => setCopyright(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {SEO_PRESETS.copyrights.slice(0, 3).map((c, idx) => (
                    <Chip key={idx} label={c} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} onClick={() => setCopyright(c)} />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* 4. Camera Specifications */}
          <Paper elevation={0} sx={{ p: 3.5, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CameraAltIcon color="primary" /> 📷 Thông tin Thiết bị & Camera
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ShuffleIcon />}
                onClick={handleRandomDevice}
                sx={{ textTransform: 'none', borderRadius: 2.5, fontWeight: 700 }}
              >
                Random thiết bị
              </Button>
            </Box>

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="medium">
                  <InputLabel>Hãng Camera</InputLabel>
                  <Select
                    value={cameraMake}
                    label="Hãng Camera"
                    onChange={(e) => setCameraMake(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    {Object.keys(CAMERA_MODELS).map((make) => (
                      <MenuItem key={make} value={make}>{make}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="medium">
                  <InputLabel>Model Thiết bị</InputLabel>
                  <Select
                    value={cameraModel}
                    label="Model Thiết bị"
                    onChange={(e) => setCameraModel(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    {(CAMERA_MODELS[cameraMake] || []).map((model) => (
                      <MenuItem key={model} value={model}>{model}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="medium">
                  <InputLabel>Phần mềm chỉnh sửa</InputLabel>
                  <Select
                    value={editingSoftware}
                    label="Phần mềm chỉnh sửa"
                    onChange={(e) => setEditingSoftware(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    {EDITING_SOFTWARES.map((software) => (
                      <MenuItem key={software} value={software}>{software}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* 5. Advanced Config switches */}
          <Paper elevation={0} sx={{ p: 3.5, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsIcon color="primary" /> ⚙️ Tùy chọn nâng cao khi Xuất
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch checked={clearOriginalExif} onChange={(e) => setClearOriginalExif(e.target.checked)} />}
                  label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Xoá EXIF gốc trước khi ghi mới</Typography>}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch checked={useFileNameAsTitle} onChange={(e) => setUseFileNameAsTitle(e.target.checked)} />}
                  label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Lấy tên file làm Title tiêu đề</Typography>}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch checked={stripAccents} onChange={(e) => setStripAccents(e.target.checked)} />}
                  label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Bỏ dấu tiếng Việt cho tên file xuất</Typography>}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch checked={spaceToDash} onChange={(e) => setSpaceToDash(e.target.checked)} />}
                  label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Thay khoảng trắng bằng dấu gạch ngang (-)</Typography>}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch checked={authorInComment} onChange={(e) => setAuthorInComment(e.target.checked)} />}
                  label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Thêm tác giả (Author) vào Comment</Typography>}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch checked={authorInTitle} onChange={(e) => setAuthorInTitle(e.target.checked)} />}
                  label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Thêm tác giả (Author) vào Title</Typography>}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch checked={rating5Stars} onChange={(e) => setRating5Stars(e.target.checked)} />}
                  label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Đánh giá ảnh 5 sao mặc định</Typography>}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch checked={compressImage} onChange={(e) => setCompressImage(e.target.checked)} />}
                  label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Nén ảnh JPEG khi xử lý</Typography>}
                />
              </Grid>

              {compressImage && (
                <Grid item xs={12} sx={{ mt: 1, px: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 1 }}>
                    CHẤT LƯỢNG NÉN ẢNH JPEG: {compressionQuality}%
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Typography variant="caption">Nhỏ gọn</Typography>
                    <Slider
                      value={compressionQuality}
                      onChange={(_, val) => setCompressionQuality(val as number)}
                      min={50}
                      max={100}
                      valueLabelDisplay="auto"
                      sx={{ flex: 1 }}
                    />
                    <Typography variant="caption">Chất lượng cao</Typography>
                  </Box>
                </Grid>
              )}

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              {/* Resize image configuration */}
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch checked={resizeImage} onChange={(e) => setResizeImage(e.target.checked)} />}
                  label={<Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>📐 Kích hoạt Resize ảnh tối ưu SEO</Typography>}
                />
              </Grid>

              {resizeImage && (
                <Grid item xs={12}>
                  <Box sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'action.hover', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>
                      CẤU HÌNH KÍCH THƯỚC (RESIZE)
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Preset kích thước</InputLabel>
                          <Select
                            value={resizePreset}
                            label="Preset kích thước"
                            onChange={(e) => {
                              const val = e.target.value;
                              setResizePreset(val);
                              if (val === 'seo-standard') {
                                setResizeWidth(800);
                                setResizeHeight(800);
                                setKeepAspectRatio(true);
                              } else if (val === 'seo-blog') {
                                setResizeWidth(1200);
                                setResizeHeight(800);
                                setKeepAspectRatio(true);
                              } else if (val === 'facebook-og') {
                                setResizeWidth(1200);
                                setResizeHeight(630);
                                setKeepAspectRatio(false);
                              } else if (val === 'square') {
                                setResizeWidth(600);
                                setResizeHeight(600);
                                setKeepAspectRatio(false);
                              }
                            }}
                            sx={{ borderRadius: 2 }}
                          >
                            <MenuItem value="custom">Tùy chọn (Custom)</MenuItem>
                            <MenuItem value="seo-standard">Standard SEO (800px width)</MenuItem>
                            <MenuItem value="seo-blog">Blog SEO Landscape (1200x800)</MenuItem>
                            <MenuItem value="facebook-og">Facebook OpenGraph (1200x630)</MenuItem>
                            <MenuItem value="square">Square SEO (600x600)</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <TextField
                          label="Chiều rộng (px)"
                          type="number"
                          size="small"
                          fullWidth
                          value={resizeWidth}
                          onChange={(e) => {
                            setResizeWidth(parseInt(e.target.value) || 0);
                            setResizePreset('custom');
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <TextField
                          label="Chiều cao (px)"
                          type="number"
                          size="small"
                          fullWidth
                          value={resizeHeight}
                          onChange={(e) => {
                            setResizeHeight(parseInt(e.target.value) || 0);
                            setResizePreset('custom');
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={<Switch checked={keepAspectRatio} onChange={(e) => {
                            setKeepAspectRatio(e.target.checked);
                            setResizePreset('custom');
                          }} />}
                          label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Giữ nguyên tỷ lệ ảnh gốc (Aspect Ratio)</Typography>}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              )}

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              {/* Format & Rename options */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="medium">
                  <InputLabel>Định dạng ảnh xuất</InputLabel>
                  <Select
                    value={outputFormat}
                    label="Định dạng ảnh xuất"
                    onChange={(e) => setOutputFormat(e.target.value as any)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="jpeg">JPEG (.jpg) - Lưu đầy đủ EXIF SEO (Khuyên dùng)</MenuItem>
                    <MenuItem value="webp">WebP (.webp) - Tối ưu PageSpeed (Không EXIF)</MenuItem>
                    <MenuItem value="png">PNG (.png) - Không nén mất chi tiết (Không EXIF)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="medium">
                  <InputLabel>Đặt tên file chuẩn SEO</InputLabel>
                  <Select
                    value={filenamePattern}
                    label="Đặt tên file chuẩn SEO"
                    onChange={(e) => setFilenamePattern(e.target.value as any)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="original">Giữ tên gốc (Bỏ dấu & thay cách = gạch ngang)</MenuItem>
                    <MenuItem value="seo-title">Đặt tên theo Tiêu đề SEO (Title)</MenuItem>
                    <MenuItem value="seo-keywords">Đặt tên theo Từ khóa chính đầu tiên</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              {/* Watermark image configuration */}
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch checked={addWatermark} onChange={(e) => setAddWatermark(e.target.checked)} />}
                  label={<Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>✍️ Đóng dấu ảnh (Watermark)</Typography>}
                />
              </Grid>

              {addWatermark && (
                <Grid item xs={12}>
                  <Box sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'action.hover', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>
                      CẤU HÌNH ĐÓNG DẤU CHỮ (WATERMARK TEXT)
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Nội dung chữ đóng dấu"
                          size="small"
                          fullWidth
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          placeholder="e.g. © ACCSEO Studio"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Vị trí đóng dấu</InputLabel>
                          <Select
                            value={watermarkPosition}
                            label="Vị trí đóng dấu"
                            onChange={(e) => setWatermarkPosition(e.target.value as any)}
                            sx={{ borderRadius: 2 }}
                          >
                            <MenuItem value="bottom-right">Góc dưới - Phải</MenuItem>
                            <MenuItem value="bottom-left">Góc dưới - Trái</MenuItem>
                            <MenuItem value="top-right">Góc trên - Phải</MenuItem>
                            <MenuItem value="top-left">Góc trên - Trái</MenuItem>
                            <MenuItem value="center">Chính giữa ảnh</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 1 }}>
                          ĐỘ MỜ WATERMARK (OPACITY): {watermarkOpacity}%
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <Typography variant="caption">Mờ nhạt</Typography>
                          <Slider
                            value={watermarkOpacity}
                            onChange={(_, val) => setWatermarkOpacity(val as number)}
                            min={10}
                            max={100}
                            valueLabelDisplay="auto"
                            sx={{ flex: 1 }}
                          />
                          <Typography variant="caption">Rõ nét</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              )}

              {outputFormat !== 'jpeg' && (
                <Grid item xs={12}>
                  <Alert severity="warning" sx={{ borderRadius: 3 }}>
                    ⚠️ <strong>Lưu ý quan trọng:</strong> Metadata EXIF (như tọa độ GPS, từ khóa, camera) chỉ được hỗ trợ ghi mới trên định dạng <strong>JPEG (.jpg)</strong>. Định dạng <strong>{outputFormat.toUpperCase()}</strong> bạn vừa chọn sẽ bỏ qua việc chèn EXIF để ưu tiên tối ưu hóa dung lượng tải trang.
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Paper>

        </Box>
      </Grid>

      {/* Col 2: Info & Live Preview Area */}
      <Grid item xs={12} lg={4}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, position: { lg: 'sticky' }, top: { lg: 16 } }}>
          
          {/* Main Action Trigger */}
          <Paper elevation={0} sx={{ p: 3.5, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', textAlign: 'center' }}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleProcessImages}
              disabled={images.length === 0 || progress !== null}
              startIcon={progress !== null ? <CircularProgress size={18} color="inherit" /> : <CloudDownloadIcon />}
              sx={{
                py: 2,
                borderRadius: 3.5,
                fontWeight: 900,
                fontSize: '1rem',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #00b894 0%, #009975 100%)',
                boxShadow: '0 4px 15px rgba(0, 184, 148, 0.25)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #3dd6a0 0%, #009975 100%)',
                },
              }}
            >
              {progress !== null ? `Đang xử lý ảnh (${progress.current}/${progress.total})` : `Xử lý & Tải về ${images.length} ảnh`}
            </Button>
            
            {progress !== null && (
              <Box sx={{ width: '100%', mt: 2.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={(progress.current / progress.total) * 100}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            )}
          </Paper>

          {/* Saved Stats Card */}
          {savedStats && (
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'success.light', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 184, 148, 0.08)' : 'rgba(0, 184, 148, 0.04)' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'success.main', display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                📈 Báo cáo dung lượng nén tối ưu
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, fontSize: '0.8rem' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'text.secondary' }}>Số lượng ảnh đã xử lý:</span>
                  <strong>{savedStats.count} ảnh</strong>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'text.secondary' }}>Dung lượng gốc:</span>
                  <strong>{(savedStats.originalSize / 1024 / 1024).toFixed(2)} MB</strong>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'text.secondary' }}>Dung lượng sau tối ưu:</span>
                  <strong>{(savedStats.optimizedSize / 1024).toFixed(1)} KB</strong>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, pt: 0.5, borderTop: '1px dashed', borderColor: 'divider' }}>
                  <span style={{ fontWeight: 700 }}>Tiết kiệm được:</span>
                  <span style={{ color: '#00b894', fontWeight: 800 }}>
                    {((1 - savedStats.optimizedSize / savedStats.originalSize) * 100).toFixed(1)}% dung lượng
                  </span>
                </Box>
              </Box>
            </Paper>
          )}

          {/* 6. Live EXIF/CMD Preview */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <CodeIcon /> Xem trước EXIF Metadata
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<MapIcon />}
                onClick={() => window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank')}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                Google Maps
              </Button>
            </Box>

            {/* Sub DMS values */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: 'action.hover', p: 1.5, borderRadius: 2.5, mb: 2, fontSize: '0.8rem' }}>
              <Box><strong>Vĩ độ DMS:</strong> {dmsLat}</Box>
              <Box><strong>Kinh độ DMS:</strong> {dmsLng}</Box>
            </Box>

            <Tabs value={previewTab} onChange={(_, val) => setPreviewTab(val)} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tab label="Google Images" sx={{ textTransform: 'none', fontWeight: 700 }} />
              <Tab label="EXIF JSON" sx={{ textTransform: 'none', fontWeight: 700 }} />
              <Tab label="ExifTool CMD" sx={{ textTransform: 'none', fontWeight: 700 }} />
            </Tabs>

            {previewTab === 0 ? (
              <Box sx={{ p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 1.5 }}>
                  MÔ PHỎNG HIỂN THỊ GOOGLE IMAGE CARD
                </Typography>
                <Box sx={{ 
                  maxWidth: 240, 
                  mx: 'auto', 
                  borderRadius: 2.5, 
                  overflow: 'hidden', 
                  bgcolor: 'background.paper', 
                  border: '1px solid', 
                  borderColor: 'divider',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.02)' }
                }}>
                  {images.length > 0 ? (
                    <Box sx={{ width: '100%', height: 150, overflow: 'hidden', position: 'relative' }}>
                      <img 
                        src={images[0].previewUrl} 
                        alt="Google Search Preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <Box sx={{ 
                        position: 'absolute', 
                        bottom: 4, 
                        right: 4, 
                        bgcolor: 'rgba(0,0,0,0.7)', 
                        color: '#fff', 
                        px: 0.8, 
                        py: 0.2, 
                        borderRadius: 1, 
                        fontSize: '0.65rem',
                        fontWeight: 700
                      }}>
                        {resizeImage ? `${resizeWidth} x ${resizeHeight}` : 'Gốc'}
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ width: '100%', height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', color: 'text.secondary' }}>
                      <CameraAltIcon sx={{ fontSize: 32, opacity: 0.5 }} />
                    </Box>
                  )}
                  <Box sx={{ p: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.8 }}>
                      <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff', fontWeight: 900 }}>
                        {author ? author.charAt(0).toUpperCase() : 'W'}
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                        {author || 'Website của bạn'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ 
                      fontWeight: 700, 
                      color: 'primary.main', 
                      fontSize: '0.82rem', 
                      lineHeight: 1.25,
                      mb: 0.8,
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      height: 34
                    }}>
                      {finalTitle || 'Tiêu đề bài viết tối ưu SEO của hình ảnh'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                      {(() => {
                        let previewName = images.length > 0 ? images[0].name : 'image.jpg';
                        const dotIdx = previewName.lastIndexOf('.');
                        let rawName = dotIdx !== -1 ? previewName.substring(0, dotIdx) : previewName;
                        if (filenamePattern === 'seo-title' && title.trim()) {
                          rawName = title.trim();
                        } else if (filenamePattern === 'seo-keywords' && keywords.trim()) {
                          const firstKeyword = keywords.split(',')[0].trim();
                          if (firstKeyword) rawName = firstKeyword;
                        }
                        if (stripAccents) rawName = removeVietnameseTones(rawName);
                        if (spaceToDash) {
                          rawName = rawName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
                        }
                        if (!rawName.trim()) rawName = 'optimized-image';
                        const ext = outputFormat === 'webp' ? 'webp' : outputFormat === 'png' ? 'png' : 'jpg';
                        return `domain.com/.../${rawName}.${ext}`;
                      })()}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ) : previewTab === 1 ? (
              <Box
                sx={{
                  p: 2,
                  bgcolor: '#1e293b',
                  color: '#f8fafc',
                  borderRadius: 2.5,
                  fontSize: '0.78rem',
                  fontFamily: 'monospace',
                  maxHeight: 280,
                  overflowY: 'auto',
                }}
              >
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {JSON.stringify(previewExifObj, null, 2)}
                </pre>
              </Box>
            ) : (
              <Box
                sx={{
                  p: 2,
                  bgcolor: '#1e293b',
                  color: '#e2e8f0',
                  borderRadius: 2.5,
                  fontSize: '0.78rem',
                  fontFamily: 'monospace',
                  maxHeight: 280,
                  overflowY: 'auto',
                }}
              >
                <Typography
                  variant="caption"
                  onClick={() => {
                    navigator.clipboard.writeText(makeExifToolCmd());
                    showToast('Đã copy câu lệnh ExifTool vào clipboard!', 'success');
                  }}
                  sx={{
                    display: 'block',
                    textAlign: 'right',
                    cursor: 'pointer',
                    color: 'primary.light',
                    textDecoration: 'underline',
                    mb: 1,
                  }}
                >
                  Sao chép câu lệnh
                </Typography>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {makeExifToolCmd()}
                </pre>
              </Box>
            )}
          </Paper>

          {/* 8. Static SEO Image Tips */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.5 }}>
              <HelpOutlinedIcon /> 💡 Mẹo Tối ưu hóa SEO Hình ảnh
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, fontSize: '0.8rem', color: 'text.secondary', lineHeight: 1.5 }}>
              <Box>
                📍 <strong>Kinh độ/Vĩ độ (GPS):</strong> Giúp Google định vị vị trí thực tế của doanh nghiệp, có lợi thế cực lớn trong SEO Local Map và GEO Search.
              </Box>
              <Box>
                🏷️ <strong>Metadata (EXIF):</strong> Ghi đè Title, XPKeywords (thẻ từ khóa) giúp công cụ tìm kiếm của Google hiểu rõ chủ thể trong ảnh.
              </Box>
              <Box>
                📷 <strong>Thông tin thiết bị:</strong> Việc bổ sung Model camera, Make (Hãng sản xuất) giúp bức ảnh trông giống chụp thực tế hơn là ảnh AI tạo hoặc copy.
              </Box>
              <Box>
                ⚙️ <strong>Tối ưu file:</strong> Nên xuất dạng JPEG để giữ thẻ EXIF tốt nhất, đặt tên file không dấu, thay khoảng trắng bằng dấu gạch ngang (`-`).
              </Box>
            </Box>
          </Paper>

        </Box>
      </Grid>
    </Grid>
  );
}
