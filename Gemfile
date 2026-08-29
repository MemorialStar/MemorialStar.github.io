# Lock `http_parser.rb` gem to `v0.6.x` on JRuby builds since newer versions of the gem
# do not have a Java counterpart.
gem "http_parser.rb", "~> 0.6.0", :platforms => [:jruby]

source "https://rubygems.org"

gem "jekyll", "~> 4.4.1"

# Ruby 4.0 dropped logger from the default gems; Jekyll 4.4 still requires it
gem "logger"

group :jekyll_plugins do
  gem "jekyll-feed"
end

platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

gem "wdm", "~> 0.1", :platforms => [:mingw, :x64_mingw, :mswin]

gem "webrick", "~> 1.8"
