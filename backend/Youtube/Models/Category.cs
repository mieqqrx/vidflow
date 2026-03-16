namespace Youtube.Models
{
    public class Category
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty; 
        public string? IconUrl { get; set; }

        public ICollection<Video> Videos { get; set; } = new List<Video>();
    }
}
