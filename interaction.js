///////////////////////////////////////////////////////////////////////////////
//
// Topographic Attribute Maps Demo
// Copyright 2020 Reinhold Preiner, Johanna Schmidt, Gabriel Mistelbauer
//
// This code is licensed under an MIT License.
// See the accompanying LICENSE file for details.
//
///////////////////////////////////////////////////////////////////////////////



function initInteractions() 
{
	// Add pattern for single heightfield selection and highlighting
	CANVAS.append("defs").append("pattern")
		.attr("id","myPattern")
		.attr("width", 40)
		.attr("height", 40)
		.attr("patternUnits","userSpaceOnUse")
		.append("path")
		.attr("fill","none")
		.attr("stroke","#111")
		.attr("stroke-width","2") 
		//.attr("d","M-1,1 l2,-2 M0,20 l20,-20 M19,21 l2,-2");
		.attr("d","M0,40 l40,-40 M0,0 l40,40");

	// initialize Menubar
	initMenubar();

	// initilaize zoom and pan capabilities
	d3.select("#tam").call(
		d3.zoom()
			.scaleExtent([.01, 100])
			.on("zoom", function() { CANVAS.attr("transform", d3.event.transform); })
	);

	// define interaction possibilities for graph svg
	setTAMInteractions();

	// define interaction possibilities for menu bar
	setMenubarInteractions();
}


/////////////////////////////////////////////////////////////////////////////
///  SVG INTERACTIONS

function setTAMInteractions()
{
	// events
	d3.select("body")
		.on("keydown", function() {
			if (d3.event.keyCode == "S".charCodeAt(0)) {
				toggleShading();
				d3.select("#settings_shading").property('checked', PARAM_SHADING);
			}
			else if (d3.event.keyCode == "R".charCodeAt(0)) {
				toggleReverseColormap();
				d3.select("#settings_reversecolor").property('checked', PARAM_REVERSE_COLORMAP);
			}
			else if (d3.event.keyCode == "I".charCodeAt(0)) {
				toggleSelectTime();
				d3.select("#settings_select_time").property('checked', PARAM_USE_MOUSEOVER);
			}
			else if (d3.event.keyCode == "E".charCodeAt(0)) {
				toggleEnergizeSimulation();
			}
			else if(d3.event.keyCode == "G".charCodeAt(0)) {
				toggleShowGraph();
				d3.select("#settings_show_graph").property('checked', PARAM_SHOW_GRAPH);
			}
			else if (d3.event.keyCode == "L".charCodeAt(0)) {
				toggleLinks();
			}
		});
	
	// make nodes draggable
	SVG_DRAGABLE_ELEMENTS.call(d3.drag()
		.on("start", dragStartNode)
		.on("drag", dragNode)
		.on("end", dragEndNode)
	);
}
//---------------------------------------------------------------------------
function mouseoverContour(c)
{
	SVG_CONTOURS
		.attr("fill",
			function(d)
			{
				// Currently selected one will be always at 0.5
				if (c.value === d.value)
				{
					return "url(#myPattern) #000";//chromadepth(0.5);
				}
				return SVG_COLORMAP(d.value);
			}
		);
}
//---------------------------------------------------------------------------
function dragStartNode(d)
{
	d3.event.sourceEvent.stopPropagation();
	if (!d3.event.active)
	{
		resetScalarField();

		if (!PARAM_ENERGIZE)
			FORCE_SIMULATION.velocityDecay(1);	// don't move anything than the selected node!

		FORCE_SIMULATION.alpha(PARAM_ALPHA).restart();
	}
	d.fx = d.x;
	d.fy = d.y;
}
//---------------------------------------------------------------------------
function dragNode(d)
{
	d.fx = d3.event.x;
	d.fy = d3.event.y;
}
//---------------------------------------------------------------------------
function toggleEnergizeSimulation()
{
	PARAM_ENERGIZE = !PARAM_ENERGIZE;
	if (PARAM_ENERGIZE)
	{
		resetScalarField();
		FORCE_SIMULATION.alpha(PARAM_ALPHA).restart();
	}
	else
		FORCE_SIMULATION.alpha(0);
}
//---------------------------------------------------------------------------
function dragEndNode(d)
{
	if (!d3.event.active && !PARAM_ENERGIZE)
		FORCE_SIMULATION.velocityDecay(PARAM_FRICTION).alpha(0);	// reset friction

	d.fx = null;
	d.fy = null;
}
//---------------------------------------------------------------------------
function toggleShading()
{
	PARAM_SHADING = !PARAM_SHADING;
	SHADING_LAYER.attr("visibility", PARAM_SHOW_CONTOURS && PARAM_SHADING ? "visible" : "hidden");
}
//---------------------------------------------------------------------------
function toggleLinks()
{
	PARAM_SHOW_LINKS = !PARAM_SHOW_LINKS;
	SVG_LINKS.attr("opacity", PARAM_SHOW_LINKS ? PARAM_LINK_OPACITY : 0)
	if (SVG_LINKS_STREETS) SVG_LINKS_STREETS.attr("opacity", PARAM_SHOW_LINKS ? PARAM_LINK_OPACITY : 0)
	if (SVG_LINKS_TUNNELS) SVG_LINKS_TUNNELS.attr("opacity", PARAM_SHOW_LINKS ? PARAM_LINK_OPACITY : 0)
	if (SVG_TUNNEL_ENTRIES_1) SVG_TUNNEL_ENTRIES_1.attr("opacity", PARAM_SHOW_LINKS ? PARAM_LINK_OPACITY : 0)
	if (SVG_TUNNEL_ENTRIES_2) SVG_TUNNEL_ENTRIES_2.attr("opacity", PARAM_SHOW_LINKS ? PARAM_LINK_OPACITY : 0)
}
//---------------------------------------------------------------------------
function toggleShowGraph()
{
	PARAM_SHOW_GRAPH = !PARAM_SHOW_GRAPH;
	GRAPH_LAYER.attr("visibility", PARAM_SHOW_GRAPH ? "visible" : "hidden");
}
//---------------------------------------------------------------------------
function toggleShowContours()
{
	PARAM_SHOW_CONTOURS = !PARAM_SHOW_CONTOURS;
	TOPO_LAYER.attr("visibility", PARAM_SHOW_CONTOURS ? "visible" : "hidden");
	SHADING_LAYER.attr("visibility", PARAM_SHOW_CONTOURS && PARAM_SHADING ? "visible" : "hidden");
}
//---------------------------------------------------------------------------
function toggleNames()
{
	PARAM_SHOW_NAMES = !PARAM_SHOW_NAMES;
	if (PARAM_SHOW_NAMES)
		showNames();
	else
	{
		if (SVG_PERSON_LABELS)	SVG_PERSON_LABELS.remove();
		if (SVG_LABELS)			SVG_LABELS.remove();
	}
}
//---------------------------------------------------------------------------
function toggleReverseColormap() 
{
	PARAM_REVERSE_COLORMAP = !PARAM_REVERSE_COLORMAP;
	setColorMap();
	updateScalarField();
}
//---------------------------------------------------------------------------
function toggleSelectTime()
{
	PARAM_USE_MOUSEOVER = !PARAM_USE_MOUSEOVER;
	if (PARAM_USE_MOUSEOVER) {
		TOPO_LAYER.selectAll("path.contours").on("mouseover", mouseoverContour);
	} else {
		resetColormap();
		TOPO_LAYER.selectAll("path.contours").on("mouseover", null);
	}
}

/////////////////////////////////////////////////////////////////////////////
///  MENUBAR INTERACTIONS

function initMenubar()
{
	d3.select("#settings_shading").property('checked', PARAM_SHADING);
	d3.select("#settings_reversecolor").property('checked', PARAM_REVERSE_COLORMAP);
	d3.select("#settings_dataset").property("value", PARAM_FILENAME);
	d3.select("#settings_noderadius").property("value", PARAM_NODE_RADIUS);
	d3.select("#settings_linkwidth").property("value", PARAM_LINK_WIDTH);
	d3.select("#settings_pnodeopacity").property("value", PARAM_PERSON_LABEL_OPACITY);
	
	// Force Simulation
	d3.select("#settings_repulsion_strength").property("value", PARAM_REPULSION_STRENGTH);
	d3.select("#settings_gravity_x").property('value', PARAM_GRAVITY_X);
	d3.select("#settings_gravity_y").property('value', PARAM_GRAVITY_Y);
	d3.select("#settings_link_strength").property("value", PARAM_LINK_STRENGTH);	
	d3.select("#settings_friction").property("value", PARAM_FRICTION);
	d3.select("#settings_simforce_strength").property("value", PARAM_SF_STRENGTH);	

	// Appearance
	d3.select("#settings_interpolation_type").property("checked", PARAM_INTERPOLATE_NN);
	d3.select("#settings_embed_links").property("checked", PARAM_EMBED_LINKS);
	d3.select("#settings_show_contours").property("checked", PARAM_SHOW_CONTOURS);	
	d3.select("#settings_show_graph").property("checked", PARAM_SHOW_GRAPH);	
	d3.select("#settings_show_links").property("checked", PARAM_SHOW_LINKS);	
	d3.select("#settings_show_names").property("checked", PARAM_SHOW_NAMES);	
	d3.select("#settings_show_tunnels").property("checked", PARAM_SHOW_TUNNELS);	
	d3.select("#settings_dilation_degree").property("value", PARAM_SCALARFIELD_DILATION_ITERS);	
	d3.select("#settings_contour_step").property("value", PARAM_CONTOUR_STEP);
	d3.select("#settings_contour_big_step").property("value", PARAM_CONTOUR_BIG_STEP);	
	d3.select("#settings_indicator_size").property("value", PARAM_INDICATOR_FONTSIZE);	
	d3.select("#settings_range_min").property("value", PARAM_RANGE_MIN);	
	d3.select("#settings_range_max").property("value", PARAM_RANGE_MAX);	
	d3.select("#settings_height_scale").property("value", PARAM_HEIGHT_SCALE);		
	d3.select("#settings_resolution").property("value", PARAM_SCALARFIELD_RESOLUTION);	
	d3.select("#settings_link_sample_step").property("value", PARAM_LINK_SAMPLE_STEPSIZE);	
	d3.select("#settings_underground_threshold").property("value", PARAM_UNDERGROUND_THRESHOLD);	
}
//---------------------------------------------------------------------------
function setMenubarInteractions()
{
	d3.select("#settings_interpolation_type").on("input", function() {
		PARAM_INTERPOLATE_NN = this.checked;
		updateScalarField();
	});

	d3.select("#settings_contour_step").property("value", PARAM_CONTOUR_STEP).on("input", function() {
		PARAM_CONTOUR_STEP = parseFloat(this.value);
		if (!PARAM_ENERGIZE)
			updateScalarField();
	});
	d3.select("#settings_contour_big_step").on("input", function() {
		PARAM_CONTOUR_BIG_STEP = parseFloat(this.value);
		if (!PARAM_ENERGIZE)
			updateScalarField();
	});
	d3.select("#settings_noderadius").on("input", function() {
		PARAM_NODE_RADIUS = parseInt(this.value);
		if (SVG_PERSON_CIRCLES) SVG_PERSON_CIRCLES.attr("r", PARAM_NODE_RADIUS)
		if (SVG_NODE_CIRCLES) SVG_NODE_CIRCLES.attr("r", PARAM_NODE_RADIUS)
	});
	d3.select("#settings_linkdist").on("input", function() {
		PARAM_LINK_DISTANCE = parseInt(this.value);
	});
	
	d3.select("#settings_linkwidth").on("input", function() {
		PARAM_LINK_WIDTH = parseInt(this.value);
		if (SVG_LINKS)	SVG_LINKS.attr("stroke-width", PARAM_LINK_WIDTH + "px");
	});
	d3.select("#settings_pnodeopacity").on("input", function() {
		PARAM_PERSON_LABEL_OPACITY = parseFloat(this.value);
		if (SVG_PERSON_LABELS) SVG_PERSON_LABELS.style("opacity", PARAM_PERSON_LABEL_OPACITY);
		if (SVG_LABELS) SVG_LABELS.style("opacity", PARAM_PERSON_LABEL_OPACITY);
	});
	d3.select("#settings_simforce_strength").on("input", function() {
		PARAM_SF_STRENGTH = parseFloat(this.value);	
	});
	d3.select("#settings_repulsion_strength").on("input", function() {
		PARAM_REPULSION_STRENGTH = this.value;	
		REPULSION_FORCE.strength(-PARAM_REPULSION_STRENGTH);
	});
	d3.select("#settings_link_strength").on("input", function() {
		PARAM_LINK_STRENGTH = this.value;	
		LINK_FORCE.strength(PARAM_LINK_STRENGTH);
	});
	d3.select("#settings_friction").on("input", function() {
		PARAM_FRICTION = parseFloat(this.value);
		FORCE_SIMULATION.velocityDecay(PARAM_FRICTION);
	});
	d3.select("#settings_gravity_x").on("input", function() {
		PARAM_GRAVITY_X = parseFloat(this.value);
		FORCE_SIMULATION.force("x", d3.forceX(0).strength(PARAM_GRAVITY_X)) 
	});
	d3.select("#settings_gravity_y").on("input", function() {
		PARAM_GRAVITY_Y = parseFloat(this.value);
		FORCE_SIMULATION.force("y", d3.forceY(0).strength(PARAM_GRAVITY_Y)) 
	});
	d3.select("#settings_embed_links").on("input", function() {
		PARAM_EMBED_LINKS = !PARAM_EMBED_LINKS;
		updateScalarField();
	});
	d3.select("#settings_dilation_degree").on("input", function() {
		PARAM_SCALARFIELD_DILATION_ITERS = parseFloat(this.value);
		updateScalarField();
	});
	d3.select("#settings_show_names").on("input", function() {
		toggleNames();
	});
	d3.select("#settings_indicator_size").on("input", function() {
		PARAM_INDICATOR_FONTSIZE = this.value;
	});
	d3.select("#settings_show_tunnels").on("input", function() {
		PARAM_SHOW_TUNNELS = !PARAM_SHOW_TUNNELS;
		updateScalarField();
	});
	d3.select("#settings_show_contours").on("input", function() {
		toggleShowContours();
	});
	d3.select("#settings_show_graph").on("input", function() {
		toggleShowGraph();
	});
	d3.select("#settings_show_links").on("input", function() {
		toggleLinks();
	});
	d3.select("#settings_shading").on("click", function(e){
		toggleShading();
	});		
	d3.select("#settings_reversecolor").on("click", function(e){
		toggleReverseColormap();
	});	
	d3.select("#settings_select_time").on("click", function(e){
		toggleSelectTime();
	});		
	d3.select("#settings_range_min").on("input", function() {
		PARAM_RANGE_MIN = parseFloat(this.value);
		setColorMap();
		updateRange();
		
		if (!PARAM_ENERGIZE) updateScalarField();
	});
	d3.select("#settings_range_max").on("input", function() {
		PARAM_RANGE_MAX = parseFloat(this.value);
		setColorMap();
		updateRange();

		if (!PARAM_ENERGIZE) updateScalarField();
	});
	d3.select("#settings_height_scale").on("input", function() {
		PARAM_HEIGHT_SCALE = parseFloat(this.value);
		if (!PARAM_ENERGIZE) updateScalarField();
	});
	d3.select("#settings_resolution").on("input", function() {
		PARAM_SCALARFIELD_RESOLUTION = parseInt(this.value);
		if (!PARAM_ENERGIZE) updateScalarField();
	});
	d3.select("#settings_link_sample_step").on("input", function() {
		PARAM_LINK_SAMPLE_STEPSIZE = parseInt(this.value);
		if (!PARAM_ENERGIZE) updateScalarField();
	});
	d3.select("#settings_underground_threshold").on("input", function() {
		PARAM_UNDERGROUND_THRESHOLD = parseFloat(this.value);
		if (!PARAM_ENERGIZE) updateScalarField();
	});
}
//---------------------------------------------------------------------------

