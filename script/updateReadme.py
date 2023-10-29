import json

filename = ".github/classroom/autograding.json"
readme = "Readme.md"


def write_section(file, title, content):
    if(content != None):
        file.write(f"# {title}\n")
        file.write(f"{content}\n")
#def write_test(file, title, content):
#    if(content != None):
#        file.write(f"### {title}")



if "__main__" == __name__:
    with open(filename, 'r', encoding="utf-8") as autograding_file:
        data = autograding_file.read()
        data = json.loads(data)
    with open(readme, 'w', encoding="utf-8") as readme_file:
        introduction = data.get("introduction")
        total_points = 0
        for p in data.get("tests"):
            total_points += int(p.get("points",0))
        introduction += f"\nmaximale Punktzahl: {total_points}\n"
        write_section(readme_file, "Einleitung", introduction)
        for test in data.get("tests"):
            points = test.get("points")
            name = test.get("name")
            readme_file.write(f"## {name} ({points} Punkte)\n")
            have_specs = test.get("specs")
            # print the title of the exercise
            if (have_specs != None):
                title = have_specs.get("title")
                write_section(readme_file, title, None)
                # print the list of subexercises
                if "list" in have_specs:
                    content = ""
                    for l in have_specs["list"]:
                        content += ("## " + l + "\n")
                    write_section(readme_file, have_specs.get("title"), content)
                # print the code examples for help        
                if "code_example" in have_specs:
                    write_section(readme_file, "Code-Beispiel", f"`{have_specs.get("code_example")}`")
                #print ( json.dumps(have_specs, indent=4) );


                # print the list of urls for help
                if "urls" in test:
                    content = ""
                    for l in test["urls"]:
                       content += ( "### [Spickzettel]("  + l + ") \n")
                    write_section(readme_file, "Spickzettel", content)
                
    readme_file.close()
    autograding_file.close()
