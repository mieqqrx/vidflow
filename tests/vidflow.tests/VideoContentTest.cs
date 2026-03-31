using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;
using SeleniumExtras.WaitHelpers;
using Xunit;
namespace vidflow.tests
{
    public class VideoContentTest : IDisposable
    {
        private readonly IWebDriver _driver;
        private readonly WebDriverWait _wait;
        private const string url= "http://localhost:3000";

        public VideoContentTest()
        {
           
            _driver = new ChromeDriver();
            _driver.Manage().Window.Maximize();
            _wait = new WebDriverWait(_driver,TimeSpan.FromSeconds(5));
        }
        private void LoginUser()
        {
            _driver.Navigate().GoToUrl($"{url}/login");
            _wait.Until(ExpectedConditions.ElementIsVisible(By.Name("email"))).SendKeys("test@gmail.com");
            _driver.FindElement(By.Name("password")).SendKeys("StrongPass123!");

            var loginBtn = _driver.FindElement(By.CssSelector("form button[type='submit']"));
            ((IJavaScriptExecutor)_driver).ExecuteScript("arguments[0].click();", loginBtn);

            _wait.Until(ExpectedConditions.UrlContains("/"));
        }
        [Fact]
        public void Search_And_Navigate_Video_Test()
        {
            LoginUser();
            _driver.Navigate().GoToUrl(url);
            var loginLink = _wait.Until(ExpectedConditions.ElementToBeClickable(By.CssSelector("a[href='/login']")));
            loginLink.Click();
            Thread.Sleep(2000);
            var email = _wait.Until(ExpectedConditions.ElementToBeClickable(By.Name("email")));
            email.SendKeys("test@gmail.com");
            Thread.Sleep(1000);
            var password = _driver.FindElement(By.Name("password"));
            password.SendKeys("StrongPass123!");
            Thread.Sleep(500);
            var submitButton1 = _wait.Until(ExpectedConditions.ElementToBeClickable(By.XPath("//button[text()='Next']")));
            submitButton1.Click();
            Thread.Sleep(1000);
            _wait.Until(ExpectedConditions.UrlContains("/"));
            Assert.Contains("/", _driver.Url);
            _driver.Navigate().GoToUrl(url);
            var searchInput = _wait.Until(ExpectedConditions.ElementIsVisible(By.CssSelector("input[type='text']")));
            string title = "123";
            searchInput.SendKeys(title);
            var searchBtn = _driver.FindElement(By.CssSelector("button[type='submit']"));
            searchBtn.Click();
            Thread.Sleep(2200);
            var videoCard = _wait.Until(ExpectedConditions.ElementToBeClickable(By.CssSelector("a[href*='/watch/']")));
            videoCard.Click();
            _wait.Until(ExpectedConditions.UrlContains("/watch/"));
            Thread.Sleep(2000);
            Assert.Contains("/watch/",_driver.Url);
            var videoPlayer = _wait.Until(ExpectedConditions.ElementIsVisible(By.TagName("video")));
            Assert.True(videoPlayer.Displayed, "Відеоплеєр не відображається на сторінці");
            var titleOnVideo = _driver.FindElement(By.TagName("h1")).Text;
            Assert.NotEmpty(titleOnVideo);
            var comment = _driver.FindElement(By.CssSelector("input[placeholder='Add a public comment...']"));
            string mycomment = "test";
            comment.SendKeys(mycomment);
            Thread.Sleep(1500);
            var submitButton2 = _wait.Until(ExpectedConditions.ElementToBeClickable(By.XPath("//button[text()='Comment']")));
            ((IJavaScriptExecutor)_driver).ExecuteScript("arguments[0].click();", submitButton2);
            var successMessage = _wait.Until(ExpectedConditions.ElementIsVisible(By.XPath($"//*[contains(text(), '{mycomment}')]")));
            Thread.Sleep(3500);
            var likeButton = _wait.Until(ExpectedConditions.ElementToBeClickable(
            By.CssSelector("button:has(svg.lucide-thumbs-up)")));
            var likeCountElement = likeButton.FindElement(By.TagName("span"));
            int initialLikes = int.Parse(likeCountElement.Text);
            likeButton.Click();
            Thread.Sleep(1000);
            int updatedLikes = int.Parse(likeCountElement.Text);
            Assert.True(updatedLikes >= initialLikes);
            var subscribetButton = _wait.Until(ExpectedConditions.ElementToBeClickable(By.XPath("//button[text()='Subscribe']")));
            ((IJavaScriptExecutor)_driver).ExecuteScript("arguments[0].click();", subscribetButton);


        }
          

        public void Dispose() => _driver.Quit();
       
    }
}