using Elastic.Clients.Elasticsearch;
using Elastic.Clients.Elasticsearch.QueryDsl;
using Microsoft.EntityFrameworkCore;
using VidFlow.Models.Search;

namespace VidFlow.Services
{
    public class RecommendationService : IRecommendationService
    {
        private readonly ElasticsearchClient _client;
        private readonly IServiceScopeFactory _scopeFactory;
        private const string IndexName = "videos";

        public RecommendationService(ElasticsearchClient client, IServiceScopeFactory scopeFactory)
        {
            _client = client;
            _scopeFactory = scopeFactory;
        }

        public async Task<IEnumerable<VideoDocument>> GetPersonalizedAsync(
            Guid userId, int count = 20, Guid? excludeVideoId = null)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var watchHistories = await context.WatchHistories
                .Where(w => w.UserId == userId)
                .OrderByDescending(w => w.WatchedAt)
                .Take(50)
                .ToListAsync();

            var watchedVideoIds = watchHistories.Select(w => w.VideoId).ToList();

            var likedVideoIds = await context.VideoLikes
                .Where(l => l.UserId == userId)
                .Select(l => l.VideoId)
                .ToListAsync();

            var subscribedChannelIds = await context.Subscriptions
                .Where(s => s.UserId == userId)
                .Select(s => s.ChannelId)
                .ToListAsync();

            var preferredTags = new List<string>();
            var preferredCategories = new List<string>();

            var interactedIds = watchedVideoIds.Union(likedVideoIds).Distinct().ToList();

            if (interactedIds.Any())
            {
                var likedVideos = await context.Videos
                    .Include(v => v.Category)
                    .Where(v => likedVideoIds.Contains(v.Id))
                    .ToListAsync();

                var watchedVideos = await context.Videos
                    .Include(v => v.Category)
                    .Where(v => watchedVideoIds.Contains(v.Id))
                    .ToListAsync();

                var watchHistoryDict = watchHistories.ToDictionary(w => w.VideoId);

                var tagWeights = new Dictionary<string, double>();
                var categoryWeights = new Dictionary<string, double>();

                foreach (var v in likedVideos)
                {
                    foreach (var tag in v.Tags ?? Array.Empty<string>())
                        tagWeights[tag] = tagWeights.GetValueOrDefault(tag) + 2.0;

                    if (v.Category != null)
                        categoryWeights[v.Category.Name] = categoryWeights.GetValueOrDefault(v.Category.Name) + 2.0;
                }

                foreach (var v in watchedVideos)
                {
                    var watchPercent = watchHistoryDict.TryGetValue(v.Id, out var wh) ? wh.WatchedPercent : 0;
                    var weight = watchPercent >= 80 ? 1.5 : watchPercent >= 40 ? 1.0 : 0.5;

                    foreach (var tag in v.Tags ?? Array.Empty<string>())
                        tagWeights[tag] = tagWeights.GetValueOrDefault(tag) + weight;

                    if (v.Category != null)
                        categoryWeights[v.Category.Name] = categoryWeights.GetValueOrDefault(v.Category.Name) + weight;
                }

                preferredTags = tagWeights
                    .OrderByDescending(kv => kv.Value)
                    .Take(10)
                    .Select(kv => kv.Key)
                    .ToList();

                preferredCategories = categoryWeights
                    .OrderByDescending(kv => kv.Value)
                    .Take(5)
                    .Select(kv => kv.Key)
                    .ToList();
            }

            // Ранний return — но теперь обогащаем WatchedPercent
            if (!subscribedChannelIds.Any() && !preferredTags.Any() && !preferredCategories.Any())
            {
                var popular = (await GetPopularAsync(count)).ToList();
                return await EnrichWithWatchPercentAsync(popular, userId, context);
            }

            var shouldQueries = new List<Query>();

            if (subscribedChannelIds.Any())
            {
                shouldQueries.Add(new Query
                {
                    Terms = new TermsQuery
                    {
                        Field = "channelId",
                        Terms = new TermsQueryField(
                            subscribedChannelIds.Select(id => FieldValue.String(id.ToString())).ToArray()
                        ),
                        Boost = 3.0f
                    }
                });
            }

            if (preferredTags.Any())
            {
                shouldQueries.Add(new Query
                {
                    Terms = new TermsQuery
                    {
                        Field = "tags",
                        Terms = new TermsQueryField(
                            preferredTags.Select(t => FieldValue.String(t)).ToArray()
                        ),
                        Boost = 2.0f
                    }
                });
            }

            if (preferredCategories.Any())
            {
                shouldQueries.Add(new Query
                {
                    Terms = new TermsQuery
                    {
                        Field = "categoryName",
                        Terms = new TermsQueryField(
                            preferredCategories.Select(c => FieldValue.String(c)).ToArray()
                        ),
                        Boost = 1.5f
                    }
                });
            }

            var filterQueries = new List<Query>
            {
                new Query
                {
                    Term = new TermQuery { Field = "visibility", Value = (int)VideoVisibility.Public }
                },
                new Query
                {
                    Term = new TermQuery { Field = "isShort", Value = false }
                }
            };

            var excludeIds = watchedVideoIds.Select(id => id.ToString()).ToList();
            if (excludeVideoId.HasValue)
                excludeIds.Add(excludeVideoId.Value.ToString());

            var mustNotQueries = new List<Query>();
            if (excludeIds.Any())
            {
                mustNotQueries.Add(new Query
                {
                    Ids = new IdsQuery
                    {
                        Values = excludeIds.ToArray()
                    }
                });
            }

            var boolQuery = new BoolQuery
            {
                Should = shouldQueries,
                Filter = filterQueries,
                MustNot = mustNotQueries.Any() ? mustNotQueries : null,
                MinimumShouldMatch = 0
            };

            var response = await _client.SearchAsync<VideoDocument>(new SearchRequest(IndexName)
            {
                Size = count,
                Query = new Query { Bool = boolQuery },
                Sort = new List<SortOptions>
                {
                    new SortOptions { Score = new ScoreSort { Order = SortOrder.Desc } }
                }
            });

            var results = response.Documents.ToList();

            // Сначала добираем популярные если не хватает
            if (results.Count < count)
            {
                var popular = await GetPopularAsync(count - results.Count);
                var existingIds = results.Select(v => v.Id).ToHashSet();
                results.AddRange(popular.Where(v => !existingIds.Contains(v.Id)));
            }

            // Потом обогащаем весь итоговый список
            return await EnrichWithWatchPercentAsync(results, userId, context);
        }

        public async Task<IEnumerable<VideoDocument>> GetSimilarAsync(
            Guid videoId, int count = 20, Guid? userId = null)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var video = await context.Videos
                .Include(v => v.Category)
                .FirstOrDefaultAsync(v => v.Id == videoId);

            if (video == null) return await GetPopularAsync(count);

            var shouldQueries = new List<Query>
            {
                new Query
                {
                    Term = new TermQuery
                    {
                        Field = "channelId",
                        Value = video.ChannelId.ToString(),
                        Boost = 2.0f
                    }
                }
            };

            if (video.Tags?.Any() == true)
            {
                shouldQueries.Add(new Query
                {
                    Terms = new TermsQuery
                    {
                        Field = "tags",
                        Terms = new TermsQueryField(
                            video.Tags.Select(t => FieldValue.String(t)).ToArray()
                        ),
                        Boost = 3.0f
                    }
                });
            }

            if (video.Category != null)
            {
                shouldQueries.Add(new Query
                {
                    Term = new TermQuery
                    {
                        Field = "categoryName",
                        Value = video.Category.Name,
                        Boost = 1.5f
                    }
                });
            }

            var response = await _client.SearchAsync<VideoDocument>(new SearchRequest(IndexName)
            {
                Size = count,
                Query = new Query
                {
                    Bool = new BoolQuery
                    {
                        Should = shouldQueries,
                        Filter = new List<Query>
                        {
                            new Query
                            {
                                Term = new TermQuery
                                {
                                    Field = "visibility",
                                    Value = (int)VideoVisibility.Public
                                }
                            },
                            new Query
                            {
                                Term = new TermQuery { Field = "isShort", Value = false }
                            }
                        },
                        MustNot = new List<Query>
                        {
                            new Query
                            {
                                Ids = new IdsQuery
                                {
                                    Values = new[] { videoId.ToString() }
                                }
                            }
                        },
                        MinimumShouldMatch = 1
                    }
                },
                Sort = new List<SortOptions>
                {
                    new SortOptions { Score = new ScoreSort { Order = SortOrder.Desc } }
                }
            });

            var results = response.Documents.ToList();

            if (results.Count < count)
            {
                var popular = await GetPopularAsync(count - results.Count);
                var existingIds = results.Select(v => v.Id).ToHashSet();
                results.AddRange(popular.Where(v => !existingIds.Contains(v.Id)));
            }

            if (userId.HasValue)
                return await EnrichWithWatchPercentAsync(results, userId.Value, context);

            return results;
        }

        public async Task<IEnumerable<VideoDocument>> GetPopularAsync(int count = 20)
        {
            var response = await _client.SearchAsync<VideoDocument>(new SearchRequest(IndexName)
            {
                Size = count,
                Query = new Query
                {
                    Bool = new BoolQuery
                    {
                        Filter = new List<Query>
                        {
                            new Query
                            {
                                Term = new TermQuery { Field = "visibility", Value = (int)VideoVisibility.Public }
                            },
                            new Query
                            {
                                Term = new TermQuery { Field = "isShort", Value = false }
                            }
                        }
                    }
                },
                Sort = new List<SortOptions>
                {
                    new SortOptions
                    {
                        Field = new FieldSort("viewsCount") { Order = SortOrder.Desc }
                    }
                }
            });

            return response.Documents;
        }

        public async Task<IEnumerable<VideoDocument>> GetShortsRecommendationsAsync(
            Guid? userId, int count = 20, Guid? excludeVideoId = null)
        {
            var filterQueries = new List<Query>
            {
                new Query { Term = new TermQuery { Field = "visibility", Value = (int)VideoVisibility.Public } },
                new Query { Term = new TermQuery { Field = "isShort", Value = true } }
            };

            var mustNotQueries = new List<Query>();
            if (excludeVideoId.HasValue)
                mustNotQueries.Add(new Query { Ids = new IdsQuery { Values = new[] { excludeVideoId.Value.ToString() } } });

            if (userId.HasValue)
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var watchedIds = await context.WatchHistories
                    .Where(w => w.UserId == userId.Value)
                    .OrderByDescending(w => w.WatchedAt)
                    .Take(50)
                    .Select(w => w.VideoId)
                    .ToListAsync();

                var likedIds = await context.VideoLikes
                    .Where(l => l.UserId == userId.Value)
                    .Select(l => l.VideoId)
                    .ToListAsync();

                var subscribedChannelIds = await context.Subscriptions
                    .Where(s => s.UserId == userId.Value)
                    .Select(s => s.ChannelId)
                    .ToListAsync();

                var excludeIds = watchedIds.Select(id => id.ToString()).ToList();
                if (excludeVideoId.HasValue)
                    excludeIds.Add(excludeVideoId.Value.ToString());

                if (excludeIds.Any())
                    mustNotQueries.Add(new Query { Ids = new IdsQuery { Values = excludeIds.ToArray() } });

                var likedShorts = await context.Videos
                    .Include(v => v.Category)
                    .Where(v => likedIds.Contains(v.Id) && v.IsShort)
                    .ToListAsync();

                var preferredTags = likedShorts
                    .SelectMany(v => v.Tags ?? Array.Empty<string>())
                    .GroupBy(t => t)
                    .OrderByDescending(g => g.Count())
                    .Take(10)
                    .Select(g => g.Key)
                    .ToList();

                var preferredCategories = likedShorts
                    .Where(v => v.Category != null)
                    .GroupBy(v => v.Category!.Name)
                    .OrderByDescending(g => g.Count())
                    .Take(5)
                    .Select(g => g.Key)
                    .ToList();

                var shouldQueries = new List<Query>();

                if (subscribedChannelIds.Any())
                    shouldQueries.Add(new Query
                    {
                        Terms = new TermsQuery
                        {
                            Field = "channelId",
                            Terms = new TermsQueryField(
                                subscribedChannelIds.Select(id => FieldValue.String(id.ToString())).ToArray()
                            ),
                            Boost = 3.0f
                        }
                    });

                if (preferredTags.Any())
                    shouldQueries.Add(new Query
                    {
                        Terms = new TermsQuery
                        {
                            Field = "tags",
                            Terms = new TermsQueryField(
                                preferredTags.Select(t => FieldValue.String(t)).ToArray()
                            ),
                            Boost = 2.0f
                        }
                    });

                if (preferredCategories.Any())
                    shouldQueries.Add(new Query
                    {
                        Terms = new TermsQuery
                        {
                            Field = "categoryName",
                            Terms = new TermsQueryField(
                                preferredCategories.Select(c => FieldValue.String(c)).ToArray()
                            ),
                            Boost = 1.5f
                        }
                    });

                if (shouldQueries.Any())
                {
                    var response = await _client.SearchAsync<VideoDocument>(new SearchRequest(IndexName)
                    {
                        Size = count,
                        Query = new Query
                        {
                            Bool = new BoolQuery
                            {
                                Should = shouldQueries,
                                Filter = filterQueries,
                                MustNot = mustNotQueries.Any() ? mustNotQueries : null,
                                MinimumShouldMatch = 0
                            }
                        },
                        Sort = new List<SortOptions>
                        {
                            new SortOptions { Score = new ScoreSort { Order = SortOrder.Desc } }
                        }
                    });

                    var results = response.Documents.ToList();

                    if (results.Count < count)
                    {
                        var popular = await GetPopularShortsAsync(count - results.Count);
                        var existingIds = results.Select(v => v.Id).ToHashSet();
                        results.AddRange(popular.Where(v => !existingIds.Contains(v.Id)));
                    }

                    return results;
                }
            }

            return await GetPopularShortsAsync(count);
        }

        private async Task<IEnumerable<VideoDocument>> GetPopularShortsAsync(int count = 20)
        {
            var response = await _client.SearchAsync<VideoDocument>(new SearchRequest(IndexName)
            {
                Size = count,
                Query = new Query
                {
                    Bool = new BoolQuery
                    {
                        Filter = new List<Query>
                        {
                            new Query { Term = new TermQuery { Field = "visibility", Value = (int)VideoVisibility.Public } },
                            new Query { Term = new TermQuery { Field = "isShort", Value = true } }
                        }
                    }
                },
                Sort = new List<SortOptions>
                {
                    new SortOptions { Field = new FieldSort("viewsCount") { Order = SortOrder.Desc } }
                }
            });

            return response.Documents;
        }

        private async Task<List<VideoDocument>> EnrichWithWatchPercentAsync(
            List<VideoDocument> videos, Guid userId, AppDbContext context)
        {
            if (!videos.Any()) return videos;

            var videoIds = videos.Select(v => v.Id).ToList();
            var watchHistoryMap = await context.WatchHistories
                .Where(w => w.UserId == userId && videoIds.Contains(w.VideoId))
                .ToDictionaryAsync(w => w.VideoId, w => w.WatchedPercent);

            foreach (var doc in videos)
            {
                if (watchHistoryMap.TryGetValue(doc.Id, out var percent))
                    doc.WatchedPercent = percent;
            }

            return videos;
        }
    }
}
