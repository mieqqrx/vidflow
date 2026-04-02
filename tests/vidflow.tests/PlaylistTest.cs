using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;
using SeleniumExtras.WaitHelpers;
using System.Runtime.Intrinsics.X86;
using Xunit;
namespace vidflow.tests
{
    public class PlaylistTest : IDisposable
    {
        private readonly IWebDriver _driver;
        private readonly WebDriverWait _wait;
        private const string url= "http://localhost:3000";

        public PlaylistTest()
        {
           
            _driver = new ChromeDriver();
            _driver.Manage().Window.Maximize();
            _wait = new WebDriverWait(_driver,TimeSpan.FromSeconds(5));
        }
        [Fact]
        public void Should_Add_Videos_To_Playlist()
        {
            _driver.Navigate().GoToUrl($"{url}/login");
            _wait.Until(ExpectedConditions.ElementIsVisible(By.Name("email"))).SendKeys("test@gmail.com");
            _driver.FindElement(By.Name("password")).SendKeys("StrongPass123!");
            _driver.FindElement(By.XPath("//button[text()='Next']")).Click();
            _wait.Until(ExpectedConditions.UrlContains("/"));
            var videoCard = _wait.Until(ExpectedConditions.ElementToBeClickable(By.CssSelector("a[href*='/watch/']")));
            videoCard.Click();
            _wait.Until(ExpectedConditions.UrlContains("/watch/"));
            var openSaveDialogBtn = _wait.Until(ExpectedConditions.ElementToBeClickable(By.XPath("//button[contains(., 'Save')]")));
            openSaveDialogBtn.Click();
            var dialog=_wait.Until(ExpectedConditions.ElementIsVisible(By.CssSelector("div[role='dialog']")));
            var watchLaterOption = dialog.FindElement(By.XPath("//span[text()='Смотреть позже']/ancestor::label"));
            var checkbox = watchLaterOption.FindElement(By.CssSelector("button[role='checkbox']"));
            if (checkbox.GetAttribute("aria-checked") == "false")
            {
                watchLaterOption.Click();
                Thread.Sleep(500);
                _wait.Until(d => checkbox.GetAttribute("aria-checked") == "true");
            }
            var saveButton=dialog.FindElement(By.XPath(".//button[text()='Save']"));
            saveButton.Click();
            _wait.Until(ExpectedConditions.InvisibilityOfElementLocated(By.CssSelector("div[role='dialog']")));
     
            _driver.Navigate().GoToUrl($"{url}/playlist?list=WL");
            string videoTitle = "123";
            var videoEntryXPath = $"//h3[text()='{videoTitle}']/ancestor::div[contains(@class, 'group')]";
            var videoEntry = _wait.Until(ExpectedConditions.ElementIsVisible(By.XPath(videoEntryXPath)));
            Thread.Sleep(500);
            var menuTrigger = videoEntry.FindElement(By.CssSelector("button[data-slot='dropdown-menu-trigger']"));
            ((IJavaScriptExecutor)_driver).ExecuteScript("arguments[0].click();", menuTrigger);
            Thread.Sleep(500);
            var menuContent = _wait.Until(ExpectedConditions.ElementToBeClickable(By.CssSelector("div[role='menu']")));
            var removeOption = menuContent.FindElement(By.XPath("//div[@role='menuitem' and contains(., 'Remove from playlist')]"));
            removeOption.Click();
            _wait.Until(ExpectedConditions.InvisibilityOfElementLocated(By.XPath(videoEntryXPath)));

        }

        public void Dispose() => _driver.Quit();
       
    }
}