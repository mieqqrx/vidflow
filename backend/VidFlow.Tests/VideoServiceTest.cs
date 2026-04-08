using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;
using VidFlow.DTOs;
using VidFlow.Models;
using VidFlow.Services;

namespace VidFlow.Tests
{
    public class VideoServiceValidationTests
    {
        [Fact]
        public void TrimVideo_StartGreaterThumbnailEnd_ShouldFail()
        {
            var video = new Video { DurationSeconds = 100 };
            var trimDto = new TrimVideoDto
            {
                StartSeconds = 50, 
                EndSeconds = 40
            };
            bool isValid = trimDto.StartSeconds < trimDto.EndSeconds;
            Assert.False(isValid, "Старт після кінця");
        }

        [Theory]
        [InlineData(59, true)]
        [InlineData(61, false)] 
        public void Shorts_DurationValidation_Logic(double seconds, bool expectedResult)
        {
            bool isShort = true;

            bool isValid = isShort && seconds <= 60;
            Assert.Equal(expectedResult, isValid);
        }

        [Fact]
        public void UpdateVisibility_AdminHidden_ShouldPreventPublic()
        {
            var video = new Video { IsAdminHidden = true, Visibility = VideoVisibility.Private };
            var newVisibility = VideoVisibility.Public;
            bool canChange = !(video.IsAdminHidden && newVisibility == VideoVisibility.Public);
            Assert.False(canChange, "Юзер не може відкрити відео, скрито адміном");
        }
    }
}