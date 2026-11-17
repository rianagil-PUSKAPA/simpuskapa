#!/bin/bash
set -e

BUMP=$1

aws s3 cp s3://simpuskapa-web-builds/CURRENT_VERSION CURRENT_VERSION

echo "Starting incremental build $1 $2"


cp -rv .aws/* ~/.aws/

# 1 -- clean build dir
rm -rf deployment/build
mkdir -p deployment/build

# 2 -- copy to build dir
echo "Copying to build dir"
rm -rf node_modules
cp -rv ./* deployment/build/ 
pnpm install


# -------------------- DEVELOPMENT

# 3 -- copy env and package json target run pnpm install
cp deployment/envs/env.development deployment/build/.env
cp deployment/package.json deployment/build/package.json
echo "clean lock"
rm -rf deployment/build/pnpm-lock.yaml
rm -rf deployment/build/src/server
rm -rf deployment/build/prisma
rm -rf deployment/build/src/tests


cd deployment/build

# 4 -- bump & lint & build
cp package.json package.json.c
jq '.version = "'$(cat CURRENT_VERSION)'"' package.json.c > package.json
pnpm install
pnpm install @typescript-eslint/eslint-plugin@latest --save-dev
pnpm bump:$BUMP
pnpm lint
pnpm next build --no-lint

# 5 -- zip
CURRENT_VERSION=$(cat package.json | jq '.version' -r)
FILE_NAME="simpuskapa-webapp-development-$CURRENT_VERSION.zip"
zip -r $FILE_NAME ./.next/*

# 6 -- upload to s3
aws s3 cp $FILE_NAME s3://simpuskapa-web-builds/webapp/$FILE_NAME
echo $CURRENT_VERSION > CURRENT_VERSION
aws s3 cp CURRENT_VERSION s3://simpuskapa-web-builds/CURRENT_VERSION

# 7 -- clean build dir
cd ../../
#rm -rf deployment/build/

echo "SUCCESS BUILD ARTIFACT $FILE_NAME"



# -------------------- STAGING

# 3 -- copy env and package json target run pnpm install
cp deployment/envs/env.staging deployment/build/.env
cp deployment/package.json deployment/build/package.json
echo "clean lock"
rm -rf deployment/build/pnpm-lock.yaml
rm -rf deployment/build/src/server
rm -rf deployment/build/prisma
rm -rf deployment/build/src/tests


cd deployment/build

# 4 -- bump & lint & build
rm -rf .next
pnpm next build --no-lint

# 5 -- zip
FILE_NAME="simpuskapa-webapp-staging-$CURRENT_VERSION.zip"
zip -r $FILE_NAME ./.next/*

# 6 -- upload to s3
aws s3 cp $FILE_NAME s3://simpuskapa-web-builds/webapp/$FILE_NAME
echo $CURRENT_VERSION > CURRENT_VERSION
aws s3 cp CURRENT_VERSION s3://simpuskapa-web-builds/CURRENT_VERSION

# 7 -- clean build dir
cd ../../
#rm -rf deployment/build/

echo "SUCCESS BUILD ARTIFACT $FILE_NAME"



# -------------------- PRODUCTION

# 3 -- copy env and package json target run pnpm install
cp deployment/envs/env.production deployment/build/.env
cp deployment/package.json deployment/build/package.json
echo "clean lock"
rm -rf deployment/build/pnpm-lock.yaml
rm -rf deployment/build/src/server
rm -rf deployment/build/prisma
rm -rf deployment/build/src/tests


cd deployment/build

# 4 -- bump & lint & build
rm -rf .next
pnpm next build --no-lint

# 5 -- zip
FILE_NAME="simpuskapa-webapp-production-$CURRENT_VERSION.zip"
zip -r $FILE_NAME ./.next/*

# 6 -- upload to s3
aws s3 cp $FILE_NAME s3://simpuskapa-web-builds/webapp/$FILE_NAME
echo $CURRENT_VERSION > CURRENT_VERSION
aws s3 cp CURRENT_VERSION s3://simpuskapa-web-builds/CURRENT_VERSION

# 7 -- clean build dir
cd ../../
#rm -rf deployment/build/

echo "SUCCESS BUILD ARTIFACT $FILE_NAME"



aws s3 ls s3://simpuskapa-web-builds/webapp/


