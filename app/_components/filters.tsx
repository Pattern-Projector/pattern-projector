export default function Filters() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg">
      <filter id="erode-1">
        <feMorphology operator="erode" radius="1" />
      </filter>
      <filter id="erode-2">
        <feMorphology operator="erode" radius="2" />
      </filter>
      <filter id="erode-3">
        <feMorphology operator="erode" radius="3" />
      </filter>
    </svg>
  );
}
