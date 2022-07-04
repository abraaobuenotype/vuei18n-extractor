#! /usr/bin/env node
import glob from "glob";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

glob("i18nExtractor.{js,json}", (err, file) => {
  if (err) {
    console.log(err);
    process.exit(1);
    return;
  }

  if (file.length < 1) {
    console.log(
      chalk.red(
        'You must have config file "i18nExtractor.json" or "i18nExtractor.js". See the documentation'
      )
    );
    process.exit(0);
    return;
  }

  initialize(file[0]);
});

function initialize(file) {
  const configType = {
    js: jsNormalize,
    ts: jsNormalize,
    json: jsonNormalize,
  };

  const matchType = file.match(/\.(js|json)$/g)[0];

  configType[matchType.replace(".", "")](file)
    .then((config) => {
      console.log(chalk.blue('initializing extract'));
      extract(config);
    })
    .catch((err) => {
      console.log(chalk.red(err));
      process.exit(1);
    });
}

async function jsNormalize(file) {
  try {
    const config = await import(path.resolve(process.cwd(), file)).then(
      (res) => {
        return res.default;
      }
    );

    return config;
  } catch (err) {
    return err;
  }
}

async function jsonNormalize(file) {
  try {
    const config = await fs.readJSON(path.resolve(process.cwd(), file));

    return config;
  } catch (err) {
    return err;
  }
}

async function normalizeImport(importPath) {
    let file = {}
    
    if(importPath.match(/.ts$/g)){
        const source = fs.readFileSync(importPath, 'utf-8')
        const base = path.basename(importPath)
        const dir = path.dirname(importPath)
        const copyPath = path.resolve(dir, `${base}___copy.js`)

        fs.writeFileSync(copyPath, source, 'utf-8')        

        try {
            file = await import(copyPath).then(res => res.default)
        }catch(err) {
            //
        }

        fs.removeSync(copyPath)

        return file
    }

    try {
        file = await import(importPath).then(res => res.default)
    }catch(err) {
        //
    }

    return file
}

async function extract(config) {
  try {
    const paths = {};
    config.locales.forEach(async (loc) => {
      const p = path.resolve(
        process.cwd(),
        config.catalogs.outputFolder,
        `${loc}.${config.format}`
      );

      let source = {};

      if (fs.pathExistsSync(p)) {
        source = await normalizeImport(p);
      }

      paths[loc] = { path: p, source };
    });

    const sourceKeys = {}
    const keybypage = {}

    glob(
      config.catalogs.include.join(","),
      { ignore: config.catalogs.exclude },
      (err, files) => {
        if (err) {
          console.log(chalk.red(err));
          process.exit(1);
        }

        files.forEach(file => {
            const f = fs.readFileSync(path.resolve(process.cwd(), file), 'utf-8')

            const match = f.match(/\bt\(\s*(\'|\")[^\. \/ @]?\b.+(\'|\")\s*\)/gm)

            if(match) {
                match
                .map(p => p.replace(/\).+/g, ')'))
                .forEach(p => {
                    const key = p.replace(/(t\(\s*(\'|\")|(\'|\")\s*\))/g, '')
        
                    if(!sourceKeys[key]) sourceKeys[key] = []        
        
                    sourceKeys[key].push(file)
                })
            }
        })

        Object.keys(sourceKeys).forEach(k => {
            let key = ""
            const unique = [...new Set(sourceKeys[k])]
            if(unique.length > 1) key = unique.join('|-|')
           else key = sourceKeys[k][0]
       
           if(!keybypage[key]) keybypage[key] = []
       
           keybypage[key].push(k)
        })

        let finalSource = {}

        config.locales.forEach(loc => {
            if(loc !== config.sourceLocale) {
                const locKeys = Object.keys(paths[loc].source)

                locKeys.forEach(lk => {
                    if(!sourceKeys[lk]) delete locKeys[lk]
                })
                
                let locByPage = {}
                let finalLoc = "module.exports={"

                Object.keys(sourceKeys).forEach(k => {
                    if(!locKeys[k]) locKeys[k] = ""
               
                    finalSource[k] = k
                })

                Object.keys(keybypage).forEach(k => {
                    if(!locByPage[k]) locByPage[k] = {}
                
                    finalLoc += `\n\/*\n${k.replace('|-|', '\n')}\n*\/\n`
                
                    keybypage[k].forEach(key => {
                        finalLoc += `\"${key}\": \"${locKeys[key]}\",\n`
                    })
                })

                finalLoc = finalLoc.replace(/\,\n$/g, '\n}')

                fs.outputFileSync(paths[loc].path, finalLoc, 'utf-8')
            }
        })

        fs.outputFileSync(paths[config.sourceLocale].path, `module.exports=${JSON.stringify(finalSource)}`, 'utf-8')

        console.log(chalk.green('extract complete'))
        process.exit(0)
      }
    );    
  } catch (err) {
    console.log(chalk.red(err));
    process.exit(1);
  }
}
