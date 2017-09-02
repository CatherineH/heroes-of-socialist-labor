"""

Copyright (C) 2016-2017 GradientOne Inc. - All Rights Reserved
Unauthorized copying or distribution of this file is strictly prohibited
without the express permission of GradientOne Inc.

"""

# external imports
from json import dumps

import jinja2
import os
from google.appengine.ext import db

import logging
import webapp2
#from oauth2client.contrib.appengine import OAuth2DecoratorFromClientSecrets

'''
decorator = OAuth2DecoratorFromClientSecrets(
  os.path.join(os.path.dirname(__file__), 'client_secrets.json'),
  'https://www.googleapis.com/auth/drive.metadata.readonly')
'''

template_dir = os.path.join(os.path.dirname(__file__), 'templates')
jinja_env = jinja2.Environment(loader=jinja2.FileSystemLoader(template_dir))


class ScoreboardModel(db.Model):
    """For datastore kinds with fixed schemas"""
    name = db.StringProperty()
    num_boxes = db.IntegerProperty()


def is_chrome_request(request):
    ua_hdr = request.headers['User-Agent']
    if 'Chrome' not in ua_hdr and 'CriOS' not in ua_hdr:
        logging.warning("Request not from chrome. User-Agent: %s" % ua_hdr)
        return False
    else:
        return True


def require_chrome(func):
    """Decorator that requires Chrome User-Agent header"""
    def wrap(clss, *args, **kwargs):
        using_chrome = False
        try:
            using_chrome = is_chrome_request(clss.request)
        except Exception:
            logging.warning("Error checking for Chrome requirement")
        if using_chrome:
            return func(clss, *args, **kwargs)
        else:
            clss.error(400)

            msg = ("The Chrome browser is required to view this page."
                   "You can download Chrome "
                   "<a href='https://www.google.com/chrome/browser/desktop/'>"
                   "here.</a>")
            e_info = ("The GradientOne app is optimized to use Chrome. Rather"
                      " than allow this page to run sub-optimally on a "
                      "different browser, we require Chrome to ensure "
                      "that you have the highest quality experience.")
            profile = {'name': 'default'}
            clss.render('error.html',
                        profile=profile,
                        message=msg,
                        exception=e_info,
                        error_type="Chrome Required!")
    return wrap


class PageHandler(webapp2.RequestHandler):
    """Serves the instruments page"""
    #@require_chrome
    def get(self):
        self.write_html_file(self.page)

    def write_html_file(self, filename, add_profile=True, inject_header=True):
        folder = os.path.dirname(os.path.realpath(__file__))
        html_folder = os.path.join(folder, 'static/html/')
        file_path = os.path.join(html_folder, filename)
        with open(file_path, 'r') as f:
            html = f.read()
        # todo: add profiles
        '''
        if inject_header:  # also adds profile html also
            try:
                profile = self.get_profile_dict()
                html = self._inject_header(html, profile)
                html = self._add_profile_html(html, profile)
            except:
                pass
        elif add_profile:
            try:
                profile = self.get_profile_dict()
                html = self._add_profile_html(base_html=html,
                                              profile=profile,
                                              html_folder=html_folder)
            except:
                pass
        '''
        self.response.out.write(html)


class IntroPage(PageHandler):
    page = "intro.html"


class GamePage(PageHandler):
    page = "game.html"


class ScoreboardPage(PageHandler):
    page = "scoreboard.html"



class Scoreboard(webapp2.RequestHandler):
    def post(self):
        logging.info(self.request)
        name = self.request.get("name")
        num_boxes = self.request.get("num_boxes")
        num_boxes = int(num_boxes)
        sbm = ScoreboardModel(key_name=name, name=name, num_boxes=num_boxes)
        sbm.put()

    def get(self):
        name = self.request.get("name")
        if name:
            key = db.Key.from_path("ScoreboardModel", name)
            mdo = db.get(key)
            self.response.write(dumps({"name": mdo.name, "num_boxes": mdo.num_boxes}))
        else:
            values = ScoreboardModel.all()
            count = values.count(limit=1000)
            if count == 0:
                self.response.write("[]")
            else:
                values = values.fetch(limit=1000)
                values = [{"name": v.name, "num_boxes": v.num_boxes} for v in values]
                self.response.write(dumps(values))


app = webapp2.WSGIApplication([
    #(decorator.callback_path, decorator.callback_handler()),
    ('/', IntroPage),
    ('/game', GamePage),
    ('/scoreboard/data', Scoreboard),
    ('/scoreboard', ScoreboardPage),
], debug=False)  # change to True to get responses w/out error.html
