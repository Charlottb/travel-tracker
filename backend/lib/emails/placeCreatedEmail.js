const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Html, Head, Preview, Body, Container, Section, Text, Button } = require('@react-email/components');

function PlaceCreatedEmail({ userName, placeTitle, placeDescription, placeCategory, lat, lng, deepLink }) {
  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(Preview, null, `Dein neuer Ort „${placeTitle}“ wurde angelegt.`),
    React.createElement(
      Body,
      { style: { margin: 0, fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8fafc', color: '#111827' } },
      React.createElement(
        Container,
        { style: { padding: '24px', maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' } },
        React.createElement(Text, { style: { fontSize: '20px', fontWeight: '700', marginBottom: '16px' } }, `Hallo ${userName},`),
        React.createElement(Text, { style: { fontSize: '16px', marginBottom: '12px' } }, `Der neue Ort „${placeTitle}“ wurde erfolgreich gespeichert.`),
        React.createElement(Text, { style: { marginBottom: '8px' } }, `Kategorie: ${placeCategory ?? 'Keine'}`),
        React.createElement(Text, { style: { marginBottom: '8px' } }, `Koordinaten: ${lat}, ${lng}`),
        placeDescription
          ? React.createElement(Text, { style: { marginBottom: '16px' } }, `Beschreibung: ${placeDescription}`)
          : null,
        React.createElement(
          Button,
          {
            style: {
              display: 'inline-block',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              borderRadius: '10px',
              padding: '12px 20px',
              textDecoration: 'none',
            },
            href: deepLink,
          },
          'Zum Ort'
        ),
        React.createElement(Text, { style: { marginTop: '24px', fontSize: '14px', color: '#6b7280' } },
          'Wenn du diesen Ort nicht selbst angelegt hast, kannst du diese Nachricht ignorieren.'
        )
      )
    )
  );
}

function renderPlaceCreatedEmail(data) {
  return ReactDOMServer.renderToStaticMarkup(React.createElement(PlaceCreatedEmail, data));
}

module.exports = {
  renderPlaceCreatedEmail,
};
