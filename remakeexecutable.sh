# DISCLAIMER
cd D:\projects
# Change this above location to the location you want your codebade to live

mkdir VeritasNotes-v3.0.0

echo initiating build... Please wait

cp -r veritasnotes/* veritasnotes-v3.0.0/

cd veritasnotes-v3.0.0
mkdir -p storage
rm CONTRIBUTING.md config.json remakeexecutable.sh stand_tests.py
rm -rf context

pyinstaller --onefile --windowed --add-data "templates;templates" --add-data "static;static" --add-data "app;app" --add-data "storage;storage" --hidden-import flask --hidden-import jinja2 --hidden-import app --hidden-import app.app --paths . launcher.py
echo Download complete!
echo Removing duplicacies... 

mv dist/launcher.exe launcher.exe
mv launcher.exe VeritasNotes.exe
rm -rf dist
rm -rf build
rm -f *.spec
rm -rf app
rm -rf templates
rm -rf standard_test
rm -rf static
echo build complete!
