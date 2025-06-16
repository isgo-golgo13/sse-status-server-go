import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const D3Screen = ({ events, connectionStatus }) => {
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 300 });

  // Extract status data for visualization
  const getStatusData = () => {
    const statusEvents = events
      .filter(event => event.type === 'status' && event.data)
      .slice(-20) // Keep last 20 points for performance
      .map((event, index) => ({
        index,
        timestamp: new Date(event.data.timestamp),
        cpu: event.data.cpu || 0,
        memory: event.data.memory || 0,
        status: event.data.status
      }));
    
    return statusEvents;
  };

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const container = svgRef.current.parentElement;
        setDimensions({
          width: container.clientWidth - 48, // Account for padding
          height: 300
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // D3 Visualization
  useEffect(() => {
    if (!svgRef.current) return;

    const data = getStatusData();
    if (data.length === 0) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height);

    const margin = { top: 40, right: 80, bottom: 60, left: 60 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, Math.max(data.length - 1, 1)])
      .range([0, width]);

    const cpuScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.cpu) * 1.1 || 100])
      .range([height, 0]);

    const memoryScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.memory) * 1.1 || 100])
      .range([height, 0]);

    // Line generators
    const cpuLine = d3.line()
      .x((d, i) => xScale(i))
      .y(d => cpuScale(d.cpu))
      .curve(d3.curveMonotoneX);

    const memoryLine = d3.line()
      .x((d, i) => xScale(i))
      .y(d => memoryScale(d.memory))
      .curve(d3.curveMonotoneX);

    // Gradients
    const defs = svg.append('defs');

    const cpuGradient = defs.append('linearGradient')
      .attr('id', 'cpu-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', height + margin.top)
      .attr('x2', 0).attr('y2', margin.top);

    cpuGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#dc3545')
      .attr('stop-opacity', 0.1);

    cpuGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#dc3545')
      .attr('stop-opacity', 0.6);

    const memoryGradient = defs.append('linearGradient')
      .attr('id', 'memory-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', height + margin.top)
      .attr('x2', 0).attr('y2', margin.top);

    memoryGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#333333')
      .attr('stop-opacity', 0.1);

    memoryGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#333333')
      .attr('stop-opacity', 0.6);

    // Grid lines
    const xAxis = d3.axisBottom(xScale)
      .ticks(Math.min(data.length, 8))
      .tickFormat(i => {
        const point = data[Math.floor(i)];
        return point ? point.timestamp.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : '';
      });

    const yAxisCPU = d3.axisLeft(cpuScale)
      .ticks(6)
      .tickFormat(d => `${d}`);

    const yAxisMemory = d3.axisRight(memoryScale)
      .ticks(6)
      .tickFormat(d => `${d}MB`);

    // Add grid
    g.selectAll('.grid-line-x')
      .data(xScale.ticks(8))
      .enter().append('line')
      .attr('class', 'grid-line-x')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#e0e0e0')
      .attr('stroke-width', 1)
      .attr('opacity', 0.5);

    g.selectAll('.grid-line-y')
      .data(cpuScale.ticks(6))
      .enter().append('line')
      .attr('class', 'grid-line-y')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => cpuScale(d))
      .attr('y2', d => cpuScale(d))
      .attr('stroke', '#e0e0e0')
      .attr('stroke-width', 1)
      .attr('opacity', 0.5);

    // CPU area
    const cpuArea = d3.area()
      .x((d, i) => xScale(i))
      .y0(height)
      .y1(d => cpuScale(d.cpu))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'url(#cpu-gradient)')
      .attr('d', cpuArea);

    // Memory area
    const memoryArea = d3.area()
      .x((d, i) => xScale(i))
      .y0(height)
      .y1(d => memoryScale(d.memory))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'url(#memory-gradient)')
      .attr('d', memoryArea)
      .attr('opacity', 0.7);

    // CPU line
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#dc3545')
      .attr('stroke-width', 3)
      .attr('d', cpuLine);

    // Memory line
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#333333')
      .attr('stroke-width', 3)
      .attr('d', memoryLine);

    // Data points - CPU
    g.selectAll('.cpu-dot')
      .data(data)
      .enter().append('circle')
      .attr('class', 'cpu-dot')
      .attr('cx', (d, i) => xScale(i))
      .attr('cy', d => cpuScale(d.cpu))
      .attr('r', 4)
      .attr('fill', '#dc3545')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    // Data points - Memory
    g.selectAll('.memory-dot')
      .data(data)
      .enter().append('circle')
      .attr('class', 'memory-dot')
      .attr('cx', (d, i) => xScale(i))
      .attr('cy', d => memoryScale(d.memory))
      .attr('r', 4)
      .attr('fill', '#333333')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    // Axes
    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis)
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)')
      .style('font-size', '12px')
      .style('fill', '#333333');

    g.append('g')
      .call(yAxisCPU)
      .style('font-size', '12px')
      .style('fill', '#333333');

    g.append('g')
      .attr('transform', `translate(${width}, 0)`)
      .call(yAxisMemory)
      .style('font-size', '12px')
      .style('fill', '#333333');

    // Labels
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('fill', '#dc3545')
      .text('CPU (Goroutines)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', width + margin.right - 10)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('fill', '#333333')
      .text('Memory (MB)');

    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 10)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('fill', '#333333')
      .text('Time');

    // Legend
    const legend = g.append('g')
      .attr('transform', `translate(${width - 150}, 20)`);

    // CPU legend
    legend.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 18)
      .attr('height', 18)
      .attr('fill', '#dc3545');

    legend.append('text')
      .attr('x', 24)
      .attr('y', 9)
      .attr('dy', '0.35em')
      .style('font-size', '14px')
      .style('font-weight', '500')
      .style('fill', '#333333')
      .text('CPU');

    // Memory legend
    legend.append('rect')
      .attr('x', 0)
      .attr('y', 25)
      .attr('width', 18)
      .attr('height', 18)
      .attr('fill', '#333333');

    legend.append('text')
      .attr('x', 24)
      .attr('y', 34)
      .attr('dy', '0.35em')
      .style('font-size', '14px')
      .style('font-weight', '500')
      .style('fill', '#333333')
      .text('Memory');

  }, [events, dimensions]);

  const getStatusMessage = () => {
    if (connectionStatus === 'connecting') return 'Connecting to server...';
    if (connectionStatus === 'disconnected') return 'Disconnected - No data to display';
    if (events.length === 0) return 'Connected - Waiting for data...';
    
    const statusData = getStatusData();
    if (statusData.length === 0) return 'Connected - No status data yet...';
    
    const latest = statusData[statusData.length - 1];
    return `Live Data - CPU: ${latest.cpu} goroutines, Memory: ${latest.memory}MB`;
  };

  return (
    <div className="d3-screen">
      {getStatusData().length === 0 ? (
        <div className="d3-placeholder">
          <div className="d3-placeholder-content">
            <h3>{getStatusMessage()}</h3>
            {connectionStatus === 'connected' && (
              <p>System metrics will appear here as they arrive...</p>
            )}
          </div>
        </div>
      ) : (
        <svg 
          ref={svgRef} 
          className="d3-visualization"
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </div>
  );
};

export default D3Screen;
