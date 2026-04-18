export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const IMAGE_LIMITS = {
  donationRawBytes: 2 * 1024 * 1024,
  avatarRawBytes: 1.5 * 1024 * 1024,
  adRawBytes: 2 * 1024 * 1024,
  donationBase64Length: 650_000,
  avatarBase64Length: 280_000,
  adBase64Length: 520_000
} as const;

type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

interface ProcessImageOptions {
  maxBytes: number;
  maxWidth: number;
  maxHeight: number;
  quality: number;
  outputType?: AllowedImageType;
  maxBase64Length: number;
}

const donationOptions: ProcessImageOptions = {
  maxBytes: IMAGE_LIMITS.donationRawBytes,
  maxWidth: 1400,
  maxHeight: 1000,
  quality: 0.82,
  outputType: "image/jpeg",
  maxBase64Length: IMAGE_LIMITS.donationBase64Length
};

const avatarOptions: ProcessImageOptions = {
  maxBytes: IMAGE_LIMITS.avatarRawBytes,
  maxWidth: 360,
  maxHeight: 360,
  quality: 0.76,
  outputType: "image/jpeg",
  maxBase64Length: IMAGE_LIMITS.avatarBase64Length
};

const adOptions: ProcessImageOptions = {
  maxBytes: IMAGE_LIMITS.adRawBytes,
  maxWidth: 1400,
  maxHeight: 1000,
  quality: 0.8,
  outputType: "image/jpeg",
  maxBase64Length: IMAGE_LIMITS.adBase64Length
};

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateImageType(file: File) {
  if (ALLOWED_IMAGE_TYPES.includes(file.type as AllowedImageType)) {
    return null;
  }

  return "Please choose a JPG, PNG, or WebP image.";
}

export function validateImageSize(file: File, maxBytes: number) {
  if (file.size <= maxBytes) {
    return null;
  }

  return `Please choose an image smaller than ${formatBytes(maxBytes)}.`;
}

export function validateBase64Length(base64: string, maxLength: number) {
  if (base64.length <= maxLength) {
    return null;
  }

  return "This image is still too large after compression. Please choose a smaller image.";
}

export function safePreviewSrc(value?: string | null) {
  if (!value) {
    return "";
  }

  if (value.startsWith("data:image/")) {
    return value;
  }

  return "";
}

export function getInitials(name?: string | null) {
  if (!name) {
    return "EP";
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "EP";
  }

  return parts.map((part) => part[0]?.toUpperCase() || "").join("");
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Could not read the selected image."));
    };

    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not process the selected image."));
    image.src = dataUrl;
  });
}

function getResizeDimensions(width: number, height: number, maxWidth: number, maxHeight: number) {
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  const ratio = Math.min(maxWidth / width, maxHeight / height);

  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio))
  };
}

async function resizeImageToBase64(file: File, options: ProcessImageOptions) {
  const originalDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(originalDataUrl);
  const { width, height } = getResizeDimensions(
    image.width,
    image.height,
    options.maxWidth,
    options.maxHeight
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Image compression is not supported in this browser.");
  }

  context.drawImage(image, 0, 0, width, height);

  const base64 = canvas.toDataURL(options.outputType || file.type, options.quality);
  const base64Error = validateBase64Length(base64, options.maxBase64Length);

  if (base64Error) {
    throw new Error(base64Error);
  }

  return base64;
}

async function processImageFile(file: File, options: ProcessImageOptions) {
  const typeError = validateImageType(file);

  if (typeError) {
    throw new Error(typeError);
  }

  const sizeError = validateImageSize(file, options.maxBytes);

  if (sizeError) {
    throw new Error(sizeError);
  }

  return resizeImageToBase64(file, options);
}

export async function processDonationImage(file: File) {
  return processImageFile(file, donationOptions);
}

export async function processAvatarImage(file: File) {
  return processImageFile(file, avatarOptions);
}

export async function processAdImage(file: File) {
  return processImageFile(file, adOptions);
}
