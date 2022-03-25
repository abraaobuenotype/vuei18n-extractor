#! /usr/bin/env node
import chalk from 'chalk'

const glob = require('glob')
const fs = require('fs-extra')
const path = require('path')


glob('extractor.{js,ts,json}', (err, file) => {
    if(err) {
        console.log(err)
        process.exit(1)
        return
    }

    if(file.length < 1) {
        console.log(chalk.red('You must have config file \"extractor.json\" or \"extractor.js\" or \"extractor.ts\". See the documentation'))
        process.exit(0)
        return
    }

    console.log(file)
})