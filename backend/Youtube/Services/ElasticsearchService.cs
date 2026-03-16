using Elastic.Clients.Elasticsearch;
using Elastic.Clients.Elasticsearch.Analysis;
using Elastic.Clients.Elasticsearch.Core.Search;
using Elastic.Clients.Elasticsearch.Mapping;
using Elastic.Clients.Elasticsearch.QueryDsl;
using Microsoft.EntityFrameworkCore;
using Youtube.DTOs;
using Youtube.Models.Search;

namespace Youtube.Services
{
    public class ElasticsearchService : IElasticsearchService
    {
        private readonly ElasticsearchClient _client;
        private readonly IServiceScopeFactory _scopeFactory;
        private const string IndexName = "videos";

        public ElasticsearchService(ElasticsearchClient client, IServiceScopeFactory scopeFactory)
        {
            _client = client;
            _scopeFactory = scopeFactory;
        }

        public async Task EnsureIndexAsync()
        {
            var exists = await _client.Indices.ExistsAsync(IndexName);
            if (exists.Exists) return;

            await _client.Indices.CreateAsync(IndexName, c => c
                .Mappings(m => m
                    .Properties(new Properties
                    {
                        { "id",             new KeywordProperty() },
                        { "title", new TextProperty {
                            Analyzer = "trigram_analyzer",
                            Fields = new Properties {
                                { "keyword", new KeywordProperty() },
                                { "standard", new TextProperty { Analyzer = "standard" } }
                            }
                        }},
                        { "description",    new TextProperty { Analyzer = "standard" } },
                        { "channelName", new TextProperty {
                            Analyzer = "trigram_analyzer",
                            Fields = new Properties {
                                { "standard", new TextProperty { Analyzer = "standard" } }
                            }
                        }},
                        { "categoryName",   new KeywordProperty() },
                        { "language",       new KeywordProperty() },
                        { "channelId",      new KeywordProperty() },
                        { "thumbnailUrl",   new KeywordProperty { Index = false } },
                        { "durationSeconds",new DoubleNumberProperty() },
                        { "viewsCount",     new IntegerNumberProperty() },
                        { "likesCount",     new IntegerNumberProperty() },
                        { "commentsCount",  new IntegerNumberProperty() },
                        { "visibility",     new IntegerNumberProperty() },
                        { "ageRestriction", new BooleanProperty() },
                        { "isShort", new BooleanProperty() },
                        { "createdAt",      new DateProperty() },
                        { "tags", new TextProperty {
                            Analyzer = "standard",
                            Fields = new Properties {
                                { "keyword", new KeywordProperty() }
                            }
                        }}
                    })
                )
                .Settings(s => s
                    .Analysis(a => a
                        .Analyzers(new Analyzers
                        {
                            { "trigram_analyzer", new CustomAnalyzer
                                {
                                    Tokenizer = "standard",
                                    Filter = new[] { "lowercase", "trigram_filter" }
                                }
                            }
                        })
                        .TokenFilters(new TokenFilters
                        {
                            { "trigram_filter", new NGramTokenFilter
                                {
                                    MinGram = 2,
                                    MaxGram = 3
                                }
                            }
                        })
                    )
                )
            );
        }

        public async Task IndexVideoAsync(VideoDocument video)
        {
            await _client.IndexAsync(video, i => i
                .Index(IndexName)
                .Id(video.Id.ToString())
            );
        }

        public async Task UpdateVideoAsync(VideoDocument video)
        {
            await _client.UpdateAsync<VideoDocument, VideoDocument>(
                IndexName,
                video.Id.ToString(),
                u => u.Doc(video)
            );
        }

        public async Task DeleteVideoAsync(Guid videoId)
        {
            await _client.DeleteAsync(IndexName, videoId.ToString());
        }

        public async Task<SearchResult> SearchVideosAsync(SearchVideosDto dto)
        {
            var from = (dto.Page - 1) * dto.PageSize;
            var mustQueries = new List<Query>();
            var filterQueries = new List<Query>();

            filterQueries.Add(new Query
            {
                Term = new TermQuery { Field = "visibility", Value = (int)VideoVisibility.Public }
            });

            filterQueries.Add(new Query
            {
                Term = new TermQuery { Field = "isShort", Value = false }
            });

            if (dto.SafeSearch)
                filterQueries.Add(new Query
                {
                    Term = new TermQuery { Field = "ageRestriction", Value = false }
                });

            if (!string.IsNullOrEmpty(dto.CategoryName))
                filterQueries.Add(new Query
                {
                    Term = new TermQuery { Field = "categoryName", Value = dto.CategoryName }
                });

            if (!string.IsNullOrEmpty(dto.Language))
                filterQueries.Add(new Query
                {
                    Term = new TermQuery { Field = "language", Value = dto.Language }
                });

            if (dto.Tags != null && dto.Tags.Any())
                filterQueries.Add(new Query
                {
                    Terms = new TermsQuery
                    {
                        Field = "tags",
                        Terms = new TermsQueryField(
                            dto.Tags.Select(t => FieldValue.String(t)).ToArray()
                        )
                    }
                });

            if (dto.MinDuration.HasValue || dto.MaxDuration.HasValue)
                filterQueries.Add(new Query
                {
                    Range = new NumberRangeQuery
                    {
                        Field = "durationSeconds",
                        Gte = dto.MinDuration,
                        Lte = dto.MaxDuration
                    }
                });

            if (!string.IsNullOrEmpty(dto.Query))
            {
                mustQueries.Add(new Query
                {
                    Bool = new BoolQuery
                    {
                        Should = new List<Query>
            {
                new Query
                {
                    MultiMatch = new MultiMatchQuery
                    {
                        Query = dto.Query,
                        Fields = new[] { "title^4", "channelName^3", "tags^2", "categoryName^1.5", "description^1" },
                        Type = TextQueryType.BestFields,
                        Operator = Operator.And
                    }
                },
                new Query
                {
                    MultiMatch = new MultiMatchQuery
                    {
                        Query = dto.Query,
                        Fields = new[] { "title^3", "channelName^2", "tags^1.5", "description^0.5" },
                        Type = TextQueryType.BestFields,
                        Fuzziness = new Fuzziness("AUTO"),
                        PrefixLength = 1,
                        MaxExpansions = 100
                    }
                },
                new Query
                {
                    MultiMatch = new MultiMatchQuery
                    {
                        Query = dto.Query,
                        Fields = new[] { "title^2", "channelName^2" },
                        Type = TextQueryType.PhrasePrefix,
                        MaxExpansions = 50
                    }
                }
            },
                        MinimumShouldMatch = 1
                    }
                });
            }
            else
            {
                mustQueries.Add(new Query { MatchAll = new MatchAllQuery() });
            }

            var boolQuery = new Query
            {
                Bool = new BoolQuery
                {
                    Must = mustQueries,
                    Filter = filterQueries
                }
            };

            var sortOptions = dto.SortBy switch
            {
                SearchSortBy.ViewsCount => new List<SortOptions>
                {
                    new SortOptions { Field = new FieldSort("viewsCount") { Order = SortOrder.Desc } }
                },
                SearchSortBy.LikesCount => new List<SortOptions>
                {
                    new SortOptions { Field = new FieldSort("likesCount") { Order = SortOrder.Desc } }
                },
                SearchSortBy.CreatedAt => new List<SortOptions>
                {
                    new SortOptions { Field = new FieldSort("createdAt") { Order = SortOrder.Desc } }
                },
                SearchSortBy.Duration => new List<SortOptions>
                {
                    new SortOptions { Field = new FieldSort("durationSeconds") { Order = SortOrder.Asc } }
                },
                _ => new List<SortOptions>
                {
                    new SortOptions { Score = new ScoreSort { Order = SortOrder.Desc } }
                }
            };

            var response = await _client.SearchAsync<VideoDocument>(new SearchRequest(IndexName)
            {
                From = from,
                Size = dto.PageSize,
                Query = boolQuery,
                Sort = sortOptions
            });

            if (!response.IsValidResponse)
            {
                Console.WriteLine("\n=== ELASTICSEARCH ERROR ===");
                Console.WriteLine(response.DebugInformation);
                Console.WriteLine("===========================\n");
            }

            return new SearchResult
            {
                Videos = response.Documents,
                Total = response.Total,
                Page = dto.Page,
                PageSize = dto.PageSize
            };
        }

        public async Task<IEnumerable<string>> GetSuggestionsAsync(string query)
        {
            if (string.IsNullOrEmpty(query) || query.Length < 2)
                return Enumerable.Empty<string>();

            var response = await _client.SearchAsync<VideoDocument>(new SearchRequest(IndexName)
            {
                Size = 10,
                Source = new SourceConfig(new SourceFilter
                {
                    Includes = new[] { "title", "channelName" }
                }),
                Query = new Query
                {
                    Bool = new BoolQuery
                    {
                        Should = new List<Query>
                {
                    new Query
                    {
                        MatchPhrasePrefix = new MatchPhrasePrefixQuery
                        {
                            Field = "title",
                            Query = query
                        }
                    },
                    new Query
                    {
                        MatchPhrasePrefix = new MatchPhrasePrefixQuery
                        {
                            Field = "channelName",
                            Query = query
                        }
                    }
                },
                        MinimumShouldMatch = 1,
                        Filter = new List<Query>
                {
                    new Query
                    {
                        Term = new TermQuery
                        {
                            Field = "visibility",
                            Value = (int)VideoVisibility.Public
                        }
                    }
                }
                    }
                }
            });

            var titles = response.Documents.Select(d => d.Title);
            var channels = response.Documents
                .Select(d => d.ChannelName)
                .Where(n => n.StartsWith(query, StringComparison.OrdinalIgnoreCase));

            return titles
                .Concat(channels)
                .Distinct()
                .Take(8);
        }

        public async Task ReindexAllAsync()
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            await _client.Indices.DeleteAsync("videos");
            await _client.Indices.DeleteAsync("channels");
            await _client.Indices.DeleteAsync("playlists");

            await EnsureIndexAsync();

            var videos = await context.Videos
                .Include(v => v.Channel)
                .ThenInclude(c => c.Owner)
                .Where(v => v.Status == VideoStatus.Ready)
                .ToListAsync();

            if (!videos.Any()) return;

            var documents = videos.Select(v => new VideoDocument
            {
                Id = v.Id,
                Title = v.Title,
                Description = v.Description,
                Tags = v.Tags,
                Language = v.Language,
                ChannelName = v.Channel.Name,
                ChannelAvatarUrl = v.Channel.Owner.AvatarUrl,
                ChannelId = v.ChannelId,
                ThumbnailUrl = v.ThumbnailUrl,
                DurationSeconds = v.DurationSeconds,
                ViewsCount = v.ViewsCount,
                LikesCount = v.LikesCount,
                CommentsCount = v.CommentsCount,
                Visibility = (int)v.Visibility,
                IsShort = v.IsShort,
                AgeRestriction = v.AgeRestriction,
                CreatedAt = v.CreatedAt
            }).ToList();

            var bulkResponse = await _client.BulkAsync(b => b
                .Index(IndexName)
                .IndexMany(documents, (op, doc) => op.Id(doc.Id.ToString()))
            );

            if (bulkResponse.Errors)
                foreach (var item in bulkResponse.ItemsWithErrors)
                {
                    Console.WriteLine($"❌ ES bulk error: {item.Id} — {item.Error?.Reason}");
                }

            await _client.Indices.DeleteAsync("channels");
            var channelsExist = await _client.Indices.ExistsAsync("channels");

            var channels = await context.Channels
                .Include(c => c.Owner)
                .Include(c => c.Videos)
                .ToListAsync();

            if (channels.Any())
            {
                var channelDocs = channels.Select(c => new ChannelDocument
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    BannerUrl = c.BannerUrl,
                    OwnerAvatarUrl = c.Owner.AvatarUrl,
                    SubscribersCount = c.SubscribersCount,
                    VideosCount = c.Videos.Count(v => v.Status == VideoStatus.Ready),
                    CreatedAt = c.CreatedAt
                }).ToList();

                await _client.BulkAsync(b => b
                    .Index("channels")
                    .IndexMany(channelDocs, (op, doc) => op.Id(doc.Id.ToString()))
                );
            }

            var playlists = await context.Playlists
                .Include(p => p.PlaylistVideos)
                .Where(p => !p.IsPrivate && !p.IsSystem)
                .ToListAsync();

            if (playlists.Any())
            {
                var channelOwners = await context.Channels
                    .ToDictionaryAsync(c => c.OwnerId, c => c);

                var playlistDocs = playlists.Select(p =>
                {
                    channelOwners.TryGetValue(p.UserId, out var ch);
                    return new PlaylistDocument
                    {
                        Id = p.Id,
                        Title = p.Title,
                        ChannelName = ch?.Name ?? "",
                        ChannelId = ch?.Id ?? Guid.Empty,
                        ThumbnailUrl = null,
                        VideosCount = p.PlaylistVideos.Count,
                        IsPrivate = p.IsPrivate,
                        CreatedAt = p.CreatedAt
                    };
                }).ToList();

                await _client.BulkAsync(b => b
                    .Index("playlists")
                    .IndexMany(playlistDocs, (op, doc) => op.Id(doc.Id.ToString()))
                );
            }
        }

        public async Task EnsureAllIndexesAsync()
        {
            await EnsureIndexAsync(); 

            var channelsExist = await _client.Indices.ExistsAsync("channels");
            if (!channelsExist.Exists)
            {
                await _client.Indices.CreateAsync("channels", c => c
                    .Mappings(m => m
                        .Properties(new Properties
                        {
                    { "id",               new KeywordProperty() },
                    { "name",             new TextProperty { Analyzer = "trigram_analyzer",
                        Fields = new Properties {
                            { "keyword", new KeywordProperty() }
                        }
                    }},
                    { "description",      new TextProperty { Analyzer = "standard" } },
                    { "bannerUrl",        new KeywordProperty { Index = false } },
                    { "ownerAvatarUrl",   new KeywordProperty { Index = false } },
                    { "subscribersCount", new IntegerNumberProperty() },
                    { "videosCount",      new IntegerNumberProperty() },
                    { "createdAt",        new DateProperty() }
                        })
                    )
                    .Settings(s => s.Analysis(a => a
                        .Analyzers(new Analyzers
                        {
                    { "trigram_analyzer", new CustomAnalyzer
                        {
                            Tokenizer = "standard",
                            Filter = new[] { "lowercase", "trigram_filter" }
                        }
                    }
                        })
                        .TokenFilters(new TokenFilters
                        {
                    { "trigram_filter", new NGramTokenFilter { MinGram = 2, MaxGram = 3 } }
                        })
                    ))
                );
            }

            var playlistsExist = await _client.Indices.ExistsAsync("playlists");
            if (!playlistsExist.Exists)
            {
                await _client.Indices.CreateAsync("playlists", c => c
                    .Mappings(m => m
                        .Properties(new Properties
                        {
                    { "id",           new KeywordProperty() },
                    { "title",        new TextProperty { Analyzer = "trigram_analyzer",
                        Fields = new Properties {
                            { "keyword", new KeywordProperty() }
                        }
                    }},
                    { "channelName",  new TextProperty { Analyzer = "trigram_analyzer" } },
                    { "channelId",    new KeywordProperty() },
                    { "channelAvatarUrl", new KeywordProperty { Index = false } },
                    { "thumbnailUrl", new KeywordProperty { Index = false } },
                    { "videosCount",  new IntegerNumberProperty() },
                    { "isPrivate",    new BooleanProperty() },
                    { "createdAt",    new DateProperty() }
                        })
                    )
                    .Settings(s => s.Analysis(a => a
                        .Analyzers(new Analyzers
                        {
                    { "trigram_analyzer", new CustomAnalyzer
                        {
                            Tokenizer = "standard",
                            Filter = new[] { "lowercase", "trigram_filter" }
                        }
                    }
                        })
                        .TokenFilters(new TokenFilters
                        {
                    { "trigram_filter", new NGramTokenFilter { MinGram = 2, MaxGram = 3 } }
                        })
                    ))
                );
            }
        }

        public async Task IndexChannelAsync(ChannelDocument channel) =>
    await _client.IndexAsync(channel, i => i.Index("channels").Id(channel.Id.ToString()));

        public async Task UpdateChannelAsync(ChannelDocument channel) =>
            await _client.UpdateAsync<ChannelDocument, ChannelDocument>(
                "channels", channel.Id.ToString(), u => u.Doc(channel));

        public async Task DeleteChannelAsync(Guid channelId) =>
            await _client.DeleteAsync("channels", channelId.ToString());

        public async Task IndexPlaylistAsync(PlaylistDocument playlist) =>
            await _client.IndexAsync(playlist, i => i.Index("playlists").Id(playlist.Id.ToString()));

        public async Task UpdatePlaylistAsync(PlaylistDocument playlist) =>
            await _client.UpdateAsync<PlaylistDocument, PlaylistDocument>(
                "playlists", playlist.Id.ToString(), u => u.Doc(playlist));

        public async Task DeletePlaylistAsync(Guid playlistId) =>
            await _client.DeleteAsync("playlists", playlistId.ToString());

        public async Task<ChannelSearchResult> SearchChannelsAsync(string query, int page = 1, int pageSize = 20)
        {
            var from = (page - 1) * pageSize;

            Query searchQuery;
            if (!string.IsNullOrEmpty(query))
            {
                searchQuery = new Query
                {
                    Bool = new BoolQuery
                    {
                        Should = new List<Query>
                {
                    new Query { MultiMatch = new MultiMatchQuery
                    {
                        Query = query,
                        Fields = new[] { "name^3", "description^1" },
                        Type = TextQueryType.BestFields,
                        Operator = Operator.And
                    }},
                    new Query { MultiMatch = new MultiMatchQuery
                    {
                        Query = query,
                        Fields = new[] { "name^3", "description^1" },
                        Type = TextQueryType.BestFields,
                        Fuzziness = new Fuzziness("AUTO"),
                        PrefixLength = 1
                    }},
                    new Query { MultiMatch = new MultiMatchQuery
                    {
                        Query = query,
                        Fields = new[] { "name^3" },
                        Type = TextQueryType.PhrasePrefix,
                        MaxExpansions = 50
                    }}
                },
                        MinimumShouldMatch = 1
                    }
                };
            }
            else
            {
                searchQuery = new Query { MatchAll = new MatchAllQuery() };
            }

            var response = await _client.SearchAsync<ChannelDocument>(new SearchRequest("channels")
            {
                From = from,
                Size = pageSize,
                Query = searchQuery,
                Sort = new List<SortOptions>
        {
            new SortOptions { Field = new FieldSort("subscribersCount") { Order = SortOrder.Desc } }
        }
            });

            return new ChannelSearchResult
            {
                Channels = response.Documents,
                Total = response.Total,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<PlaylistSearchResult> SearchPlaylistsAsync(string query, int page = 1, int pageSize = 20)
        {
            var from = (page - 1) * pageSize;

            Query searchQuery;
            if (!string.IsNullOrEmpty(query))
            {
                searchQuery = new Query
                {
                    Bool = new BoolQuery
                    {
                        Should = new List<Query>
                {
                    new Query { MultiMatch = new MultiMatchQuery
                    {
                        Query = query,
                        Fields = new[] { "title^3", "channelName^2" },
                        Type = TextQueryType.BestFields,
                        Operator = Operator.And
                    }},
                    new Query { MultiMatch = new MultiMatchQuery
                    {
                        Query = query,
                        Fields = new[] { "title^3", "channelName^2" },
                        Type = TextQueryType.BestFields,
                        Fuzziness = new Fuzziness("AUTO"),
                        PrefixLength = 1
                    }},
                    new Query { MultiMatch = new MultiMatchQuery
                    {
                        Query = query,
                        Fields = new[] { "title^3", "channelName^2" },
                        Type = TextQueryType.PhrasePrefix,
                        MaxExpansions = 50
                    }}
                },
                        MinimumShouldMatch = 1,
                        Filter = new List<Query>
                {
                    new Query { Term = new TermQuery { Field = "isPrivate", Value = false } }
                }
                    }
                };
            }
            else
            {
                searchQuery = new Query
                {
                    Bool = new BoolQuery
                    {
                        Must = new List<Query> { new Query { MatchAll = new MatchAllQuery() } },
                        Filter = new List<Query>
                {
                    new Query { Term = new TermQuery { Field = "isPrivate", Value = false } }
                }
                    }
                };
            }

            var response = await _client.SearchAsync<PlaylistDocument>(new SearchRequest("playlists")
            {
                From = from,
                Size = pageSize,
                Query = searchQuery,
                Sort = new List<SortOptions>
                {
                    new SortOptions { Field = new FieldSort("videosCount") { Order = SortOrder.Desc } }
                }
            });

            return new PlaylistSearchResult
            {
                Playlists = response.Documents,
                Total = response.Total,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<SearchResult> SearchShortsAsync(SearchVideosDto dto)
        {
            var from = (dto.Page - 1) * dto.PageSize;
            var mustQueries = new List<Query>();
            var filterQueries = new List<Query>();

            filterQueries.Add(new Query
            {
                Term = new TermQuery { Field = "visibility", Value = (int)VideoVisibility.Public }
            });

            filterQueries.Add(new Query
            {
                Term = new TermQuery { Field = "isShort", Value = true }
            });

            if (dto.SafeSearch)
                filterQueries.Add(new Query
                {
                    Term = new TermQuery { Field = "ageRestriction", Value = false }
                });

            if (!string.IsNullOrEmpty(dto.Query))
            {
                mustQueries.Add(new Query
                {
                    Bool = new BoolQuery
                    {
                        Should = new List<Query>
                {
                    new Query
                    {
                        MultiMatch = new MultiMatchQuery
                        {
                            Query = dto.Query,
                            Fields = new[] { "title^4", "channelName^3", "tags^2", "description^1" },
                            Type = TextQueryType.BestFields,
                            Operator = Operator.And
                        }
                    },
                    new Query
                    {
                        MultiMatch = new MultiMatchQuery
                        {
                            Query = dto.Query,
                            Fields = new[] { "title^3", "channelName^2", "tags^1.5", "description^0.5" },
                            Type = TextQueryType.BestFields,
                            Fuzziness = new Fuzziness("AUTO"),
                            PrefixLength = 1,
                            MaxExpansions = 100
                        }
                    },
                    new Query
                    {
                        MultiMatch = new MultiMatchQuery
                        {
                            Query = dto.Query,
                            Fields = new[] { "title^2", "channelName^2" },
                            Type = TextQueryType.PhrasePrefix,
                            MaxExpansions = 50
                        }
                    }
                },
                        MinimumShouldMatch = 1
                    }
                });
            }
            else
            {
                mustQueries.Add(new Query { MatchAll = new MatchAllQuery() });
            }

            var sortOptions = dto.SortBy switch
            {
                SearchSortBy.ViewsCount => new List<SortOptions>
                {
                    new SortOptions { Field = new FieldSort("viewsCount") { Order = SortOrder.Desc } }
                },
                        SearchSortBy.LikesCount => new List<SortOptions>
                {
                    new SortOptions { Field = new FieldSort("likesCount") { Order = SortOrder.Desc } }
                },
                        SearchSortBy.CreatedAt => new List<SortOptions>
                {
                    new SortOptions { Field = new FieldSort("createdAt") { Order = SortOrder.Desc } }
                },
                        _ => new List<SortOptions>
                {
                    new SortOptions { Score = new ScoreSort { Order = SortOrder.Desc } }
                }
            };

            var response = await _client.SearchAsync<VideoDocument>(new SearchRequest(IndexName)
            {
                From = from,
                Size = dto.PageSize,
                Query = new Query
                {
                    Bool = new BoolQuery
                    {
                        Must = mustQueries,
                        Filter = filterQueries
                    }
                },
                Sort = sortOptions
            });

            return new SearchResult
            {
                Videos = response.Documents,
                Total = response.Total,
                Page = dto.Page,
                PageSize = dto.PageSize
            };
        }
    }
}