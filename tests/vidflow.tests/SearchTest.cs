using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;
using SeleniumExtras.WaitHelpers;
using System;
using Xunit;
namespace vidflow.tests
{

    public class SearchTest : IDisposable
    {
        private readonly IWebDriver _driver;
        private readonly WebDriverWait _wait;
        private const string url = "http://localhost:3000";
        public SearchTest()
        {

            _driver = new ChromeDriver();
            _driver.Manage().Window.Maximize();
            _wait = new WebDriverWait(_driver, TimeSpan.FromSeconds(5));
        }
        [Fact]
        public void Search_Test()
        {
            _driver.Navigate().GoToUrl(url);
            var searchInput = _driver.FindElement(By.CssSelector("input[placeholder='Search']"));
            var search_query = "123466";
            searchInput.SendKeys(search_query + Keys.Enter);
            var results = _wait.Until(d =>
            {
                try
                {
                    var elements = d.FindElements(By.CssSelector("h3, a.text-lg, .line-clamp-1"));
                    if (elements.Count == 0) return null;
                    return elements.Select(e => e.Text).ToList();
                }
                catch (StaleElementReferenceException)
                {
                    return null;
                }
            });
            Assert.NotNull(results);
            bool found= false;


            var ngrams=new List<string>();
            for(int i = 0;i < search_query.Length-1;i++)
            {
                ngrams.Add(search_query.Substring(i, 2)); 
            }
            foreach(var text in results)
            {
                if(ngrams.Any(ngram=> text.Contains(ngram, StringComparison.OrdinalIgnoreCase)))
                {
                    found = true;
                    break;
                }
            }
            Assert.True(found, $"Результати не містять відео/канали");
        }
        public void Dispose() => _driver.Quit();
    }
}
