namespace Youtube.Services
{
    public interface IS3Service
    {
        Task<string> UploadFileAsync(Stream fileStream, string fileName, string bucketName, string contentType);
        Task DeleteFileAsync(string fileName, string bucketName);
        string GetFileUrl(string fileName, string bucketName);
        Task<IEnumerable<string>> ListFilesAsync(string prefix, string bucketName);
        Task DownloadFileAsync(string key, string bucketName, string destinationPath);
    }
}
