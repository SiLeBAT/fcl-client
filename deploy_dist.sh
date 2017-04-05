shopt -s extglob

if [ -d "dist" ]; then
  rm -r !(deploy_dist.sh|dist|node_modules)
  mv dist/* .
  rm -r dist
  git add *
  git commit -am "gh-pages updated"
  git push
fi

