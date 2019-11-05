#!/usr/bin/env node

const fs = require("fs"),
      path = require("path"),
      cp = require("child_process");

const util = require("util");

const stdin = process.openStdin();

function shell_out(str, pipe = process.stdout)
{
    process.stdout.write(str);
}

function shell_outln(str, pipe = process.stdout)
{
    shell_out(str + "\n", pipe);
}

function project_safetyCheck(flag)
{
    if(flag)
        shell_outln("Creating project...");
    else
    {
        shell_outln("Aborted.");
        process.exit(1);
    }
}

function project_create_packageInfo(packageInfo)
{
    packageInfo.scripts =
    {
        "start": "webpack-dev-server --mode development --content-base dist/webui",
        "build": "webpack --mode production"
    };

    packageInfo.devDependencies =
    {
        "@babel/core": "^7.6.0",
        "@babel/preset-env": "^7.6.0",
        "@babel/preset-react": "^7.0.0",
        "prop-types": "^15.7.2",
        "webpack": "^4.40.2",
        "babel-loader": "^8.0.6",
        "style-loader": "^1.0.0",
        "css-loader": "^3.2.0",
        "sass-loader": "^8.0.0",
        "node-sass": "^4.12.0",
        "sass": "^1.22.12",
        "fibers": "^4.0.1",
        "copy-webpack-plugin": "^5.0.4",
        "webpack-cli": "^3.3.8",
        "webpack-dev-server": "^3.8.0"
    };

    packageInfo.dependencies =
    {
        "react": "^16.9.0",
        "react-dom": "^16.9.0"
    };
}

function project_create_packageJson(packageInfo)
{
    fs.writeFileSync("package.json", JSON.stringify(packageInfo, null, 2));
}

function project_create_babelrc()
{
    var babelrc =
    {
        presets: [ "@babel/preset-env", "@babel/preset-react" ]
    };

    fs.writeFileSync(".babelrc", JSON.stringify(babelrc, null, 2));
}

function project_create_webpackConfig()
{
    var file = `const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: "./src/js/index.js",
    output: {
        filename: "app.js",
        path: path.resolve(__dirname, "dist")
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            },
            {
                test: /\.scss$/,
                use: [
                    { loader: "style-loader" },
                    { loader: "css-loader" },
                    {
                        loader: "sass-loader",
                        options: {
                            implementation: require("node-sass")
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new CopyPlugin([
            { from: "./src", to: "./" }
        ])
    ]
};
`;

    fs.writeFileSync("webpack.config.js", file);
}

function project_create_indexJs()
{
    var file = `import React from "react";
import ReactDOM from "react-dom";

import "../style/index.scss";
`

    fs.writeFileSync("src/js/index.js", file);
}

function project_create_indexScss()
{
    fs.writeFileSync("src/style/index.scss", "");
}

function project_create_directoryStructure()
{
    var dirs = [ "dist", "src", "src/js", "src/js/components", "src/style" ];
    
    for(var i = 0; i < dirs.length; i++)
    {
        if(fs.existsSync(dirs[i]))
        {
            var stats = fs.statSync(dirs[i]);

            if(!stats.isDirectory())
            {
                fs.unlinkSync(dirs[i]);
                fs.mkdirSync(dirs[i]);
            }
        }
        else
            fs.mkdirSync(dirs[i]);
    }
}

function __cp_git_init()
{
    cp.execSync("git init");
}

function project_create_gitRepo()
{
    if(!fs.existsSync(".git"))
        __cp_git_init();
    else
    {
        var stat = fs.statSync(".git");
        
        if(!stat.isDirectory())
        {
            fs.unlinkSync(".git");
            __cp_git_init();
        }
    }
}

function project_create_gitIgnore()
{
    fs.writeFileSync(".gitignore", "node_modules/");
}

function project_create(packageInfo)
{
    project_create_packageInfo(packageInfo);

    project_create_packageJson(packageInfo);
    project_create_babelrc();
    project_create_webpackConfig();
    
    project_create_directoryStructure();

    project_create_indexJs();
    project_create_indexScss();

    project_create_gitRepo();

    project_create_gitIgnore();

    shell_outln("Project created.");
    process.exit(0);
}

var packageInfo = {},
    step = 0;

shell_out(`package name: [${path.basename(process.cwd())}] `);
stdin.addListener("data", (data) =>
{
    var input = data.toString().trim();

    switch(step)
    {
        case 0:
            packageInfo.name = (input.length > 0) ? input : path.basename(process.cwd());
            packageInfo.name = packageInfo.name.toLowerCase();
            shell_out("version: (0.1.0) ");
            break;
        
        case 1:
            packageInfo.version = (input.length > 0) ? input : "0.1.0";
            shell_out("description: ");
            break;
        
        case 2:
            packageInfo.description = input;
            shell_out("author: ");
            break;
        
        case 3:
            packageInfo.author = input;
            shell_out("license: ");
            break;
        
        case 4:
            packageInfo.license = input;
            shell_out("Create project? [y/n] ");
            break;
    }

    if(step == 5)
    {
        if(input == "y")
        {
            project_safetyCheck(true);
            project_create(packageInfo);
        }
        else if(input == "n")
            project_safetyCheck(false);
        else
        {
            shell_outln("Invalid. Try again.");
            shell_out("Create project? [y/n] ");
        }
    }

    if(step != 5)
        step++;
});