commitMessage="$1"
release="$2"
version=$(date +"v%Y.%m.%d.%H%M%S")

# Make sure we have lastest
git pull origin develop

# Get latest packages
npm install

# Make tmp folder for grunt
mkdir -p tmp

# Run grunt scripts
grunt

# Commit to develop branch

git add . -A
git commit -m "$version: $commitMessage"
git push -u origin develop

# If a release, also push to master branch
if [ "$release" == "release" ]; then
    git push origin develop:master --force
    git tag -a "$version" -m "$version: $commitMessage"
    git push -u origin "$version"

    firebase deploy
fi

# Remove tmp folder
rm -Rf tmp
