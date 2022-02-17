import { IS_SANDBOXED } from './extension'
import { promises as fs } from 'fs'
import * as pty from './nodePty'

export class Command {
    readonly program: string
    readonly args: string[]
    private readonly cwd?: string

    constructor(program: string, args: string[], cwd?: string) {
        if (IS_SANDBOXED) {
            this.program = 'flatpak-spawn'
            args.unshift(...['--host', '--env=TERM=xterm-256color', program])
        } else {
            this.program = program
        }
        this.args = args
        this.cwd = cwd
    }

    toString(): string {
        const cmd = []
        cmd.push(this.program)
        cmd.push(...this.args.filter((arg) => {
            return arg !== '--env=TERM=xterm-256color'
        }))

        return cmd.join(' ')
    }

    /**
     * Store the command as a bash script
     * @param path save location
     */
    async saveAsScript(path: string): Promise<void> {
        const cmd = ['#!/bin/sh', '', `${this.toString()} "$@"`].join('\n')
        await fs.writeFile(path, cmd)
        await fs.chmod(path, 0o755)
    }

    spawn(): pty.IPty {
        return pty.spawn(this.program, this.args, {
            cwd: this.cwd,
        })
    }
}
