// The tagline's easter egg: clicking it fires 'die-rolled', which HeroRoller
// (components/HeroRoller) answers by spinning through its presets.
export function ClickableTagline(): React.JSX.Element {
  // A heading first: clicking it rerolls the hero's preset as a small easter egg,
  // but it stays a plain h1 for search engines and screen readers.
  return (
    <h1
      id="hero-title"
      className="clickable-tagline"
      onClick={() => window.dispatchEvent(new CustomEvent('die-rolled'))}
    >
      Throw Dice, <br />
      Not Exceptions.
    </h1>
  )
}
