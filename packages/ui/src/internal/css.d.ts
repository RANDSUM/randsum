// Stylesheets are imported as text and adopted into each element's shadow root.
declare module '*.css' {
  const text: string
  export default text
}
