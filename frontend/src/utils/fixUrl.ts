export const fixUrl = (url?: string | null) => {
    if (!url) return "";

    const MINIO_INTERNAL = process.env.NEXT_PUBLIC_MINIO_INTERNAL_URL || 'http://minio:9000';
    const MINIO_EXTERNAL = process.env.NEXT_PUBLIC_MINIO_EXTERNAL_URL || 'http://localhost:9000';

    return url.replace(MINIO_INTERNAL, MINIO_EXTERNAL);
};