import json

filename = ".github/classroom/autograding.json"
readme = "Readme.md"


def write_intro(file, title, content):
    if(content != None):
        file.write(f"# {title}\n")
        file.write(f"{content}\n")
def write_section(file, title, content):
    if(content != None):
        file.write(f"## {title}\n")
        file.write(f"{content}\n")
def write_smallsection(file, title):
        file.write(f"### {title}\n")
def write_cheatsheet_section(file, title):
        file.write(f"{title}\n")


if "__main__" == __name__:
    with open(filename, 'r', encoding="utf-8") as autograding_file:
        data = autograding_file.read()
        data = json.loads(data)
    with open(readme, 'w', encoding="utf-8") as readme_file:
        introduction = data.get("introduction")
        total_points = 0
        # print the logo
        logo_url = data.get("logo_url")
        timeframe = data.get("timeframe", "30 Minuten")
        if(logo_url != None):
            readme_file.write(f"![{introduction}]({logo_url})\n")
        for p in data.get("tests"):
            total_points += int(p.get("points",0))
        introduction += f"\n\nmaximale Punktzahl: {total_points}\n\nZeitfenster: {timeframe}\n"
        write_intro(readme_file,"Einführung", introduction)
        for test in data.get("tests"):
            have_specs = test.get("specs")
            points = test.get("points")
            title = have_specs.get("title")
            readme_file.write(f"# {title} ({points} Punkte)\n")
            #print the title of the exercise
            if (have_specs != None):
                name = test.get("name")
                write_section(readme_file, name , "")
                # print the list of subexercises
                if "list" in have_specs:
                    content = ""
                    for l in have_specs["list"]:
                        content += ("### " + l + "\n")
                        write_smallsection(readme_file, l)
                    #write_section(readme_file, have_specs.get("title"), content)
                # print the code examples for help        
                if "code_example" in have_specs:
                    write_smallsection(readme_file, f"`{have_specs.get("code_example")}`")
                #print ( json.dumps(have_specs, indent=4) );


                # print the list of urls for help
                if "urls" in test:
                    content = ""
                    for l in test["urls"]:
                       content += ( "### [Spickzettel]("  + l + ") \n")
                    write_cheatsheet_section(readme_file, content)
                
    readme_file.close()
    autograding_file.close()
