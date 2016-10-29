using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Bem;
using System.Web.Mvc;
using Todo.Models;

namespace Todo.Controllers
{
    public class HomeController : Controller
    {
        private HttpApplicationStateBase Application
        {
            get { return ControllerContext.HttpContext.Application; }
        }

        private List<TodoItem> TodoItems
        {
            get
            {
                if (!(Application["TodoItems"] is List<TodoItem>))
                {
                    Application["TodoItems"] = new List<TodoItem>();
                }

                return Application["TodoItems"] as List<TodoItem>;
            }
        }

        public ActionResult Index()
        {
            return new BemhtmlResult(new
            {
                block = "root",
                bundleBasePath = Url.Content("~/Bem/desktop.bundles/default/"),
                items = TodoItems
            });
        }

        public ActionResult Add(string text)
        {
            var item = new TodoItem { Id = Guid.NewGuid(), Text = text, Done = false };
            TodoItems.Add(item);
            return Json(item.Id, JsonRequestBehavior.AllowGet);
        }

        public ActionResult SetState(Guid id, bool done = false)
        {
            foreach (var item in TodoItems.Where(item => item.Id == id))
            {
                item.Done = done;
            }

            return new EmptyResult();
        }

        public ActionResult Delete(Guid id)
        {
            TodoItems.RemoveAll(item => item.Id == id);
            return new EmptyResult();
        }
    }
}