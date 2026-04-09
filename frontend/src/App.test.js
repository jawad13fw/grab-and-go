import { render, screen } from '@testing-library/react';
import App from './App';

// Mock react-router-dom and react-leaflet - Jest will automatically use __mocks__ directory
jest.mock('react-router-dom');
jest.mock('react-leaflet');

test('renders app', () => {
  render(<App />);
  // Check if the app renders without crashing
  expect(document.body).toBeInTheDocument();
});
