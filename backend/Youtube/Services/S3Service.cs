using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;

namespace Youtube.Services
{
    public class S3Service : IS3Service
    {
        private readonly IAmazonS3 _s3Client;
        private readonly IConfiguration _configuration;

        public S3Service(IConfiguration configuration)
        {
            _configuration = configuration;
            var minioSettings = configuration.GetSection("MinIO");

            var config = new AmazonS3Config
            {
                ServiceURL = minioSettings["Endpoint"],
                ForcePathStyle = true
            };

            var credentials = new BasicAWSCredentials(
                minioSettings["AccessKey"],
                minioSettings["SecretKey"]
            );

            _s3Client = new AmazonS3Client(credentials, config);
        }

        public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string bucketName, string contentType)
        {
            var request = new PutObjectRequest
            {
                BucketName = bucketName,
                Key = fileName,
                InputStream = fileStream,
                ContentType = contentType
            };

            await _s3Client.PutObjectAsync(request);

            return GetFileUrl(fileName, bucketName);
        }

        public async Task DeleteFileAsync(string fileName, string bucketName)
        {
            await _s3Client.DeleteObjectAsync(bucketName, fileName);
        }

        public string GetFileUrl(string fileName, string bucketName)
        {
            var endpoint = _configuration["MinIO:PublicUrl"];
            return $"{endpoint}/{bucketName}/{fileName}";
        }

        public async Task<IEnumerable<string>> ListFilesAsync(string prefix, string bucketName)
        {
            var request = new ListObjectsV2Request
            {
                BucketName = bucketName,
                Prefix = prefix
            };

            var response = await _s3Client.ListObjectsV2Async(request);
            return response.S3Objects.Select(o => o.Key);
        }

        public async Task DownloadFileAsync(string key, string bucketName, string destinationPath)
        {
            var request = new GetObjectRequest
            {
                BucketName = bucketName,
                Key = key
            };

            using var response = await _s3Client.GetObjectAsync(request);
            await response.WriteResponseStreamToFileAsync(destinationPath, false, CancellationToken.None);
        }
    }
}