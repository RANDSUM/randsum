#!/bin/bash
# Bash completion script for randsum CLI

_randsum_completions() {
  local cur prev opts
  COMPREPLY=()
  cur="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD-1]}"

  opts="--help --verbose --json --repeat --seed --completions"

  # Complete flags
  if [[ ${cur} == -* ]]; then
    COMPREPLY=($(compgen -W "${opts}" -- ${cur}))
    return 0
  fi

  # Complete after --repeat or --seed
  if [[ ${prev} == "--repeat" ]] || [[ ${prev} == "--seed" ]]; then
    return 0
  fi

  # Complete dice notation (common patterns)
  if [[ ${prev} == "randsum" ]] || [[ ${COMP_CWORD} == 1 ]]; then
    local common_notations="1d20 2d6 4d6L 2d20L 2d20H 3d6! 4d6R{1} 1d100"
    COMPREPLY=($(compgen -W "${common_notations}" -- ${cur}))
    return 0
  fi

  return 0
}

complete -F _randsum_completions randsum
