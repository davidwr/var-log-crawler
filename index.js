require('dotenv').config()

const { NodeSSH } = require('node-ssh')
const path = require('path')

const ssh = new NodeSSH()

async function main () {
    await ssh.connect({
        host: process.env.HOST,
        username: process.env.USER,
        privateKey: process.env.PRIVATEKEYFILE,
        passphrase: process.env.PASSPHRASE
    })

    const command = await ssh.execCommand('find /var/log -type f -name "*.log"| head -n 50')
    if (command.code === 0) {
        const logs = command.stdout.split('\n')
        console.log(logs)
        for await (const log of logs) {
            const sizeCommand = await ssh.execCommand('du -sh ' + log)
            if (sizeCommand.code === 0) {
                const size = sizeCommand.stdout.split('\t')[0]
                if (size === '0') {
                    console.log(`No content, skipping`)
                    continue
                }

                console.log(`File Size ${size}`)
                if (size.indexOf('M') > -1) {
                    if (size.replace('.', '').length > 3) {
                        console.log(`Too big, skipping`)
                        continue
                    }
                }
            }

            const fileName = './logs/' + path.basename(log)
            console.log(`Getting file: ${log}`)
            try {
                await ssh.getFile(fileName, log)
            } catch (error) {
                console.log(`Unable to get file ${fileName}`, error.message)
                continue
            }
            
        }
    }

    process.exit(0);
}

main()
