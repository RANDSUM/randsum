#compdef randsum
# Zsh completion script for randsum CLI

_randsum() {
  local context state line
  typeset -A opt_args

  _arguments -C \
    "1: :->notation" \
    "--help[Show help message]" \
    "--verbose[Show detailed breakdown]" \
    "--json[Output as JSON]" \
    "--repeat[Roll N times]:count:->repeat_count" \
    "--seed[Use seeded random]:seed:->seed_value" \
    "--completions[Show shell completions]" \
    && return 0

  case $state in
    notation)
      local -a common_notations
      common_notations=(
        "1d20:Single d20 roll"
        "2d6:Two six-sided dice"
        "4d6L:D&D ability score (4d6 drop lowest)"
        "2d20L:Advantage (keep highest)"
        "2d20H:Disadvantage (keep lowest)"
        "3d6!:Exploding dice"
        "4d6R{1}:Reroll 1s"
        "1d100:Percentile roll"
      )
      _describe 'dice notation' common_notations
      ;;
    repeat_count)
      _numbers
      ;;
    seed_value)
      _numbers
      ;;
  esac
}

_randsum "$@"
