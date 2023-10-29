import json
import markdown

filename = ".github/classroom/autograding.json"
readme = "Readme.md"

if "__main__" == __name__:
    print("Working")
    with open(filename, 'r', encoding="utf-8") as autograding_file:
        data = autograding_file.read()

    readme_file = open(readme, 'w', encoding="utf-8")
    data = json.loads(data)
    for test in data.get("tests"):
        have_specs = test.get("specs")
        if (have_specs != None):
            readme_file.write( "# "+have_specs.get("title") + "\n" )

            print ( json.dumps(have_specs, indent=4) );

    readme_file.close()
    autograding_file.close()

