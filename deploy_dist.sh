shopt -s extglob
rm -r !(deploy_dist.sh|dist|node_modules)
mv dist/* .
rm -r dist

